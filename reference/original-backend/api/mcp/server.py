import json
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from api.campaigns.list import get_campaigns_data
from api.dashboard.kpis import calc_kpis
from api.dashboard.meta_data import fetch_meta_account_summary
from database.core.connection import get_db
from database.core.timezone import now_sp
from database.models.product import Product
from database.models.transaction import Transaction, TransactionStatus
from services.mcp_auth import get_company_by_mcp_key

logger = logging.getLogger(__name__)
router = APIRouter(tags=["mcp-server"])

SUPPORTED_PROTOCOL_VERSIONS = {"2024-11-05", "2025-03-26"}

MCP_TOOLS = [
    {
        "name": "get_metrics",
        "description": "Retorna métricas financeiras e de performance da empresa (faturamento, gasto com anúncios, lucro, ROAS, vendas aprovadas, reembolsos e chargebacks).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "date_start": {
                    "type": "string",
                    "description": "Data inicial no formato YYYY-MM-DD (padrão: últimos 30 dias).",
                },
                "date_end": {
                    "type": "string",
                    "description": "Data final no formato YYYY-MM-DD (padrão: hoje).",
                },
            },
        },
    },
    {
        "name": "get_sales",
        "description": "Lista vendas e transações recentes da empresa com filtros opcionais por status e período.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["approved", "pending", "refunded", "chargeback", "trial"],
                    "description": "Filtrar por status da transação.",
                },
                "date_start": {
                    "type": "string",
                    "description": "Data inicial no formato YYYY-MM-DD.",
                },
                "date_end": {
                    "type": "string",
                    "description": "Data final no formato YYYY-MM-DD.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Quantidade máxima de vendas retornadas (1 a 100, padrão 20).",
                },
            },
        },
    },
    {
        "name": "list_campaigns",
        "description": "Lista campanhas de anúncios (Meta Ads) cruzadas com vendas atribuídas por UTM.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "date_start": {
                    "type": "string",
                    "description": "Data inicial no formato YYYY-MM-DD (padrão: últimos 30 dias).",
                },
                "date_end": {
                    "type": "string",
                    "description": "Data final no formato YYYY-MM-DD (padrão: hoje).",
                },
                "status_filter": {
                    "type": "string",
                    "description": "Filtrar por status da campanha (ex: ACTIVE, PAUSED).",
                },
            },
        },
    },
    {
        "name": "list_products",
        "description": "Lista os produtos cadastrados na empresa.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "search": {
                    "type": "string",
                    "description": "Termo de busca para filtrar pelo nome do produto.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Quantidade máxima de produtos retornados (1 a 100, padrão 50).",
                },
            },
        },
    },
]


def _default_dates(date_start: Optional[str], date_end: Optional[str]) -> tuple[str, str, datetime, datetime]:
    now = now_sp()
    if date_end:
        end_dt = datetime.strptime(date_end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
        end_str = date_end
    else:
        end_dt = now
        end_str = now.strftime("%Y-%m-%d")

    if date_start:
        start_dt = datetime.strptime(date_start, "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0)
        start_str = date_start
    else:
        start_dt = (end_dt - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        start_str = start_dt.strftime("%Y-%m-%d")

    return start_str, end_str, start_dt, end_dt


def _authenticate_mcp(authorization: Optional[str], db: Session):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    api_key = authorization[len("Bearer "):].strip()
    if not api_key:
        return None
    return get_company_by_mcp_key(api_key, db)


def _jsonrpc_error(req_id: Any, code: int, message: str, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": code, "message": message},
        },
    )


def _jsonrpc_result(req_id: Any, result: dict[str, Any]) -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content={
            "jsonrpc": "2.0",
            "id": req_id,
            "result": result,
        },
    )


async def _execute_tool(name: str, args: dict[str, Any], db: Session, company_id: int) -> dict[str, Any]:
    if name == "get_metrics":
        start_str, end_str, start_dt, end_dt = _default_dates(args.get("date_start"), args.get("date_end"))
        base = db.query(Transaction).filter(
            Transaction.company_id == company_id,
            Transaction.created_at >= start_dt,
            Transaction.created_at <= end_dt,
        )
        meta_summary = None
        try:
            meta_summary, _ = await fetch_meta_account_summary(db, start_str, end_str, company_id)
        except Exception as exc:
            logger.warning("MCP get_metrics Meta Ads fallback: %s", exc)
        kpis = calc_kpis(base, meta_summary)
        return {"period": {"date_start": start_str, "date_end": end_str}, "metrics": kpis}

    if name == "get_sales":
        limit = max(1, min(int(args.get("limit") or 20), 100))
        query = db.query(Transaction).filter(Transaction.company_id == company_id)

        status_val = args.get("status")
        if status_val:
            query = query.filter(Transaction.status == TransactionStatus(status_val))

        if args.get("date_start"):
            s_dt = datetime.strptime(args["date_start"], "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(Transaction.created_at >= s_dt)
        if args.get("date_end"):
            e_dt = datetime.strptime(args["date_end"], "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(Transaction.created_at <= e_dt)

        rows = query.order_by(Transaction.created_at.desc()).limit(limit).all()
        return {
            "count": len(rows),
            "sales": [
                {
                    "id": t.id,
                    "external_id": t.external_id,
                    "status": t.status.value if hasattr(t.status, "value") else t.status,
                    "platform": t.platform.value if hasattr(t.platform, "value") else t.platform,
                    "amount": t.amount,
                    "amount_mzn": t.amount_mzn,
                    "original_currency": t.original_currency,
                    "original_amount": t.original_amount,
                    "product_name": t.product_name,
                    "customer_email": t.customer_email,
                    "utm_campaign": t.utm_campaign,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
                for t in rows
            ],
        }

    if name == "list_campaigns":
        start_str, end_str, _, _ = _default_dates(args.get("date_start"), args.get("date_end"))
        result = await get_campaigns_data(
            date_start=start_str,
            date_end=end_str,
            account_id=None,
            status_filter=args.get("status_filter"),
            db=db,
            company_id=company_id,
        )
        return {"period": {"date_start": start_str, "date_end": end_str}, **result}

    if name == "list_products":
        limit = max(1, min(int(args.get("limit") or 50), 100))
        query = db.query(Product).filter(Product.company_id == company_id)
        search = (args.get("search") or "").strip()
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))
        rows = query.order_by(Product.created_at.desc()).limit(limit).all()
        return {
            "count": len(rows),
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "logo_url": p.logo_url,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in rows
            ],
        }

    raise ValueError(f"Unknown tool: {name}")


@router.get("/mcp")
def mcp_info(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    settings = _authenticate_mcp(authorization, db)
    if not settings:
        return JSONResponse(status_code=401, content={"detail": "Invalid or disabled MCP API key"})
    return {
        "name": "lomustrack-mcp",
        "version": "1.0.0",
        "transport": "streamable-http",
        "tools": [t["name"] for t in MCP_TOOLS],
    }


@router.delete("/mcp")
def mcp_close(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    settings = _authenticate_mcp(authorization, db)
    if not settings:
        return JSONResponse(status_code=401, content={"detail": "Invalid or disabled MCP API key"})
    return Response(status_code=200)


@router.post("/mcp")
async def mcp_endpoint(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    settings = _authenticate_mcp(authorization, db)
    if not settings:
        return JSONResponse(status_code=401, content={"detail": "Invalid or disabled MCP API key"})

    try:
        payload = await request.json()
    except Exception:
        return _jsonrpc_error(None, -32700, "Parse error", status_code=400)

    if not isinstance(payload, dict) or payload.get("jsonrpc") != "2.0":
        return _jsonrpc_error(payload.get("id") if isinstance(payload, dict) else None, -32600, "Invalid Request", status_code=400)

    req_id = payload.get("id")
    method = payload.get("method")
    params = payload.get("params") or {}

    # Notifications have no id and expect 202 Accepted with empty body
    if req_id is None:
        return Response(status_code=202)

    if method == "initialize":
        requested_version = params.get("protocolVersion")
        protocol_version = requested_version if requested_version in SUPPORTED_PROTOCOL_VERSIONS else "2024-11-05"
        return _jsonrpc_result(
            req_id,
            {
                "protocolVersion": protocol_version,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": "lomustrack-mcp", "version": "1.0.0"},
            },
        )

    if method == "ping":
        return _jsonrpc_result(req_id, {})

    if method == "tools/list":
        return _jsonrpc_result(req_id, {"tools": MCP_TOOLS})

    if method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments") or {}
        if not isinstance(tool_name, str) or not isinstance(tool_args, dict):
            return _jsonrpc_error(req_id, -32602, "Invalid params")
        try:
            data = await _execute_tool(tool_name, tool_args, db, settings.company_id)
            return _jsonrpc_result(
                req_id,
                {
                    "content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False)}],
                    "isError": False,
                },
            )
        except ValueError as exc:
            return _jsonrpc_error(req_id, -32602, str(exc))
        except Exception as exc:
            logger.exception("MCP tool %s failed", tool_name)
            return _jsonrpc_result(
                req_id,
                {
                    "content": [{"type": "text", "text": f"Erro ao executar {tool_name}: {exc}"}],
                    "isError": True,
                },
            )

    return _jsonrpc_error(req_id, -32601, f"Method not found: {method}")
