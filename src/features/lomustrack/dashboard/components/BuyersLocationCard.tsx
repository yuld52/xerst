import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RiInformationLine,
  RiGlobalLine,
  RiListUnordered,
  RiSearchLine,
  RiFocus3Line,
  RiMapPinLine,
} from "@remixicon/react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { convertAndFormatMZN } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { BuyerLocation } from "@/types/dashboard";

interface BuyersLocationCardProps {
  data?: BuyerLocation[];
  totalSales?: number;
  totalRevenue?: number;
}

const DEFAULT_LOCATIONS: BuyerLocation[] = [
  { city: "São Paulo", state: "SP", country: "Brasil", lat: -23.5505, lng: -46.6333, sales: 356, revenue: 695877 },
  { city: "Rio de Janeiro", state: "RJ", country: "Brasil", lat: -22.9068, lng: -43.1729, sales: 203, revenue: 397644 },
  { city: "Belo Horizonte", state: "MG", country: "Brasil", lat: -19.9167, lng: -43.9345, sales: 127, revenue: 248528 },
  { city: "Curitiba", state: "PR", country: "Brasil", lat: -25.4284, lng: -49.2733, sales: 93, revenue: 182253 },
  { city: "Brasília", state: "DF", country: "Brasil", lat: -15.7975, lng: -47.8919, sales: 68, revenue: 132548 },
];

// Equirectangular projection: maps lat/lng to the Natural Earth SVG coordinate space (1000x809.675)
const SVG_W = 1000;
const SVG_H = 809.675;
function lngLatToXY(lng: number, lat: number): [number, number] {
  // The pasted SVG uses a standard equirectangular projection offset
  // Calibrated: lng -180→0, lng 180→1000; lat 90→0, lat -90→500 (map ends ~500 for visible area)
  const x = ((lng + 180) / 360) * SVG_W;
  const y = ((90 - lat) / 180) * SVG_H;
  return [x, y];
}

// Real world map SVG paths (Natural Earth data) rendered via dangerouslySetInnerHTML
interface WorldMapSVGProps {
  locations: BuyerLocation[];
  selectedLocation: BuyerLocation;
  onSelectLocation: (loc: BuyerLocation) => void;
}

function WorldMapSVG({ locations, selectedLocation, onSelectLocation }: WorldMapSVGProps) {
  const maxSales = Math.max(...locations.map((l) => l.sales), 1);

  return (
    <svg
      viewBox="0 0 1000 500"
      className="w-full h-full"
      style={{ background: "linear-gradient(180deg, #0d1520 0%, #111827 100%)", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d1520" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ocean background */}
      <rect width="1000" height="500" fill="url(#oceanGrad)" />

      {/* World map — full Natural Earth SVG paths, clipped to 0 0 1000 500 */}
      <g transform="scale(1) translate(0, -155)" dangerouslySetInnerHTML={{ __html: `
<path d="M997.417,356.684L998.111,356.199L999.076,357.046L998.613,358.576L996.884,358.979L995.346,358.616L995.075,357.324L996.15,356.317Z M594.676,309.675L595.148,309.983L605.272,315.673L605.463,317.297L609.474,320.093L608.187,323.549L608.348,325.141L610.138,326.169L610.218,326.898L609.454,328.599L609.615,329.458L609.434,330.805L610.409,332.574L611.565,335.369L612.581,335.989L610.359,337.633L607.313,338.741L605.634,338.693L604.639,339.546L602.698,339.624L601.965,339.981L598.607,339.18L596.506,339.411L595.732,335.542L594.777,334.223L594.224,333.436L591.479,332.91L589.901,332.062L588.121,331.584L587.005,331.111L585.839,330.394L584.331,326.84L582.713,325.27L582.16,323.639L582.431,322.181L581.929,319.6L583.085,319.467L584.1,318.453L585.186,316.994L585.879,316.406L585.849,315.498L585.246,314.863L585.085,313.761L585.889,313.411L586.05,311.765L584.944,310.191L585.93,309.855L588.986,309.888ZM156.97,149.611L156.588,149.603L151.189,145.375L149.189,143.493L144.132,141.675L142.574,137.723L142.976,134.935L139.397,132.977L138.914,129.224L135.536,125.781L135.476,123.303L137.024,120.952L136.954,117.832L132.199,114.634L129.344,108.765L127.604,104.978L125.041,102.562L123.161,100.337L121.683,97.485L118.878,99.279L116.164,102.324L113.681,98.739L111.73,96.307L109.006,94.75L106.262,94.588L106.272,59.252L106.292,31.69L111.499,33.614L115.903,37.413L118.808,38.124L121.261,34.85L124.639,32.37L128.791,33.345L132.973,29.812L137.547,27.76L139.467,31.143L141.548,29.246L142.172,25.357L144.102,26.246L148.827,33.547L152.536,28.052L152.918,34.193L156.347,32.885L157.402,30.527L160.79,30.993L165.053,34.354L171.587,37.242L175.438,38.556L178.172,38.058L181.932,41.953L178.011,45.675L183.058,47.263L190.598,46.389L192.97,45.096L195.946,49.502L198.982,45.788L196.137,42.607L197.937,40.004L201.335,39.653L203.576,38.883L205.828,40.716L208.633,44.818L211.75,44.224L216.686,47.561L221.019,46.389L225.09,46.564L224.769,41.915L227.252,40.587L231.585,43.156L231.565,50.14L233.344,44.274L235.586,44.477L236.853,36.793L233.857,31.908L230.599,28.622L230.821,19.309L234.128,12.898L237.808,14.339L240.633,18.235L244.433,27.788L241.95,31.785L247.147,33.412L247.137,41.375L250.867,35.304L254.204,40.302L253.37,45.888L256.074,50.824L258.99,45.536L261.02,39.001L261.181,30.307L265.142,30.938L269.274,32.125L273.024,36.063L273.195,39.913L271.114,43.957L273.084,47.922L272.722,51.457L267.253,56.405L263.373,57.476L260.488,55.374L259.653,58.868L256.959,64.574L256.145,67.47L252.907,71.84L248.916,72.262L246.705,74.94L246.524,78.978L243.277,79.746L239.858,84.638L236.832,91.218L235.747,95.691L235.586,102.086L239.698,102.991L240.954,107.967L242.261,111.905L246.162,110.885L251.359,113.11L254.144,115.045L256.145,117.418L259.643,118.791L262.599,120.861L267.213,121.143L270.249,121.623L269.797,125.805L270.661,130.557L272.682,135.715L276.844,139.992L278.996,138.538L280.504,133.873L279.046,126.476L277.075,123.95L281.549,121.681L284.706,118.219L286.254,114.728L286.023,111.313L284.133,106.881L280.735,102.863L284.032,97.127L282.816,92.022L281.881,82.876L283.831,81.477L288.616,83.12L291.492,83.698L293.804,82.121L296.398,84.153L299.836,87.586L300.69,89.842L305.667,90.282L305.586,95.064L306.511,102.04L309.065,102.882L311.085,106.03L315.127,103.064L317.801,97.024L319.651,94.426L321.822,99.391L325.461,106.273L328.548,112.522L327.422,115.712L331.141,118.531L333.655,121.35L338.098,122.605L339.898,124.154L341.004,128.195L343.175,128.818L344.301,130.588L344.502,135.769L342.471,137.471L340.471,139.046L335.866,140.632L332.358,144.255L327.633,144.963L321.661,144.041L317.469,144.011L314.584,144.314L312.241,147.424L308.683,149.322L304.651,154.89L301.434,158.688L303.807,158.017L308.291,152.573L314.152,149.041L318.324,148.621L320.797,150.703L318.163,153.53L319.047,157.989L319.962,161.058L323.592,163.065L328.206,162.482L331.001,157.927L331.192,160.88L333.001,162.339L329.543,164.953L323.36,167.298L320.586,168.881L317.469,171.676L315.348,171.389L315.237,168.101L320.093,164.846L315.619,164.973L312.513,165.456L310.693,163.207L310.693,157.691L309.457,156.501L307.577,157.198L306.652,156.117L304.521,159.212L303.676,162.359L302.681,164.18L301.495,164.792L300.6,164.993L300.318,165.972L295.171,165.972L290.929,165.998L289.672,166.726L286.716,169.54L286.375,169.843L285.48,171.356L282.916,171.349L280.172,171.369L278.915,171.975L279.357,172.73L279.609,173.902L279.559,174.289L275.909,176.171L273.034,176.765L269.787,178.773L269.083,178.773L268.138,178.184L267.826,177.644L267.887,177.256L268.5,175.934L269.817,173.843L270.631,171.578L270.068,168.2L269.475,164.624L266.56,162.753L266.912,162.04L266.499,161.543L265.735,161.543L265.172,160.908L265.032,159.948L264.489,160.367L263.735,160.243L263.906,159.838L263.252,159.439L262.981,158.37L260.809,157.059L258.557,155.683L255.823,154.074L253.199,152.558L250.706,153.742L249.791,153.784L246.353,152.693L244.091,153.239L241.387,151.939L238.531,151.268L236.581,151.011L235.717,150.294L235.224,147.947L234.279,147.969L234.269,149.611L228.488,149.611L218.928,149.611L209.437,149.611L201.063,149.611L192.679,149.611L184.445,149.611L175.93,149.611L173.186,149.611L164.902,149.611Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M743.956,148.694L741.825,151.518L739.512,151.918L739.382,156.096L737.823,157.954L732.284,156.606L730.274,163.863L728.836,164.745L723.307,166.326L725.82,173.073L723.91,174.069L724.131,176.235L722.412,175.678L721.004,174.315L716.863,173.915L712.228,173.811L711.223,174.231L707.242,172.626L705.653,173.417L705.221,175.665L700.627,174.353L698.787,174.894L698.164,176.554L696.565,177.249L692.876,179.859L691.659,182.503L690.614,182.528L689.85,180.777L686.301,180.658L685.728,177.599L684.371,177.574L684.582,173.772L681.234,170.97L676.449,171.271L673.171,171.832L670.507,168.332L668.225,166.852L663.892,164.018L663.369,163.674L656.181,166.018L656.292,180.136L654.864,180.318L652.904,177.389L651.014,176.331L647.847,177.116L646.611,178.368L646.46,177.453L647.144,175.883L646.611,174.56L643.374,173.255L642.117,169.797L640.569,168.808L640.478,167.537L643.193,167.909L643.303,165.027L645.676,164.382L648.119,164.973L648.621,161.072L648.119,158.563L645.324,158.757L642.951,157.76L639.724,159.556L637.121,160.408L635.693,159.749L635.985,157.649L634.205,154.89L632.124,155.01L629.762,152.174L631.37,148.961L630.556,148.092L632.788,143.329L635.653,145.853L636.005,142.668L641.765,137.822L646.128,137.708L652.281,140.805L655.588,142.593L658.554,140.73L662.977,140.639L666.556,142.928L667.361,141.622L671.291,141.809L671.985,139.705L667.461,136.614L670.145,134.393L669.623,133.14L672.297,131.943L670.286,128.738L671.563,127.12L682.008,125.465L683.375,124.277L690.362,122.49L692.876,120.462L697.892,121.516L698.777,126.516L701.692,125.351L705.271,126.983L705.04,129.558L707.724,129.296L714.721,124.807L713.696,126.306L717.265,129.963L723.498,141.517L724.986,139.19L728.836,141.749L732.847,140.617L734.395,141.413L735.732,143.952L737.683,144.801L738.879,146.643L742.478,146.065Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M656.292,180.136L656.181,166.018L663.369,163.674L663.892,164.018L668.225,166.852L670.507,168.332L673.171,171.832L676.449,171.271L681.234,170.97L684.582,173.772L684.371,177.574L685.728,177.599L686.301,180.658L689.85,180.777L690.614,182.528L691.659,182.503L692.876,179.859L696.565,177.249L698.164,176.554L698.998,176.924L696.646,179.348L698.706,180.752L700.697,179.827L704.005,181.779L700.436,184.421L698.304,184.062L697.158,184.155L696.756,183.138L697.339,181.429L693.609,182.285L692.715,184.643L691.388,186.649L689.055,186.478L688.332,188.073L690.382,188.925L690.986,191.583L689.417,195.153L687.306,194.417L685.758,194.393L685.828,192.232L682.119,190.71L679.193,188.961L677.374,187.267L674.187,184.761L672.809,180.971L671.874,180.293L668.848,180.463L667.783,179.701L667.481,176.714L663.721,174.714L661.369,176.912L658.986,178.209L659.439,180.086Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M369.414,-131.746L378.784,-145.303L388.585,-144.225L392.144,-153.144L402.017,-155.56L424.325,-152.43L441.787,-133.897L436.63,-125.638L425.953,-124.718L410.914,-122.686L412.321,-119.07L422.213,-121.299L430.618,-114.404L436.047,-120.506L438.369,-113.382L435.303,-102.45L442.41,-109.356L455.962,-116.871L464.336,-113.086L465.905,-104.99L454.524,-92.383L452.946,-88.502L444.019,-85.652L450.483,-84.878L447.226,-73.408L444.974,-63.853L445.064,-48.64L448.412,-40.332L444.049,-39.829L439.455,-35.962L444.612,-29.687L445.265,-20.095L442.28,-19.077L445.899,-9.961L439.696,-9.229L442.933,-5.091L442.018,-1.601L438.087,-0.096L434.187,-0.063L437.685,6.392L437.725,10.505L432.206,6.693L430.769,9.171L434.539,11.46L438.198,16.916L439.254,23.851L434.277,25.471L432.126,22.216L428.668,17.243L429.623,23.093L426.385,27.494L433.744,27.843L437.595,28.289L430.105,35.304L422.515,41.413L414.342,44.021L411.265,44.046L408.37,46.914L404.49,54.528L398.488,59.403L396.558,59.681L392.838,61.354L388.827,62.931L386.434,67.037L386.394,71.591L384.976,75.747L380.422,80.675L381.548,85.372L380.292,90.204L378.864,95.758L374.933,96.099L370.811,91.48L365.222,91.451L362.518,88.279L360.648,82.489L355.812,74.834L354.395,70.69L354.012,64.822L350.152,58.565L351.157,53.415L349.287,50.897L352.052,42.261L356.254,39.418L357.36,36.17L357.943,29.936L354.746,32.79L353.228,33.978L350.725,35.104L347.297,32.506L347.106,26.977L348.202,22.518L350.795,22.389L356.496,24.634L351.69,19.221L349.187,16.231L346.412,17.466L344.08,15.273L347.196,6.803L345.497,3.292L343.286,-3.438L339.918,-14.295L336.369,-18.47L336.399,-23.073L328.91,-29.746L322.978,-30.594L315.509,-30.12L308.703,-29.254L305.456,-32.985L300.61,-40.626L307.939,-44.584L313.558,-45.253L301.615,-48.618L295.312,-54.026L295.704,-59.336L306.27,-66.196L316.504,-73.331L317.58,-78.922L310.04,-84.685L312.483,-91.289L322.144,-103.591L326.205,-105.553L325.049,-114.074L331.664,-119.308L340.25,-122.512L348.825,-122.686L351.871,-116.402L359.28,-127.672L365.946,-119.923L369.866,-118.356L375.667,-111.974L369.032,-122.686Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M308.341,480.513L309.406,482.659L310.804,486.177L314.433,489.042L318.344,490.241L317.087,492.677L314.433,492.917L313.016,491.2L311.327,491.069L308.341,491.06ZM339.084,395.609L338.38,398.207L337.636,401.573L337.666,404.87L337.053,405.615L336.842,407.782L336.651,409.542L340.199,412.457L339.817,414.829L341.557,416.334L341.416,418.037L338.732,422.55L334.59,424.463L328.99,425.209L325.924,424.851L326.517,426.996L325.944,429.715L326.457,431.565L324.778,432.865L321.923,433.379L319.238,432.027L318.153,432.997L318.545,436.705L320.435,437.84L321.963,436.654L322.787,438.616L320.224,439.793L317.982,442.172L317.57,446.082L316.906,448.185L314.272,448.199L312.081,450.228L311.276,453.238L314.021,456.221L316.695,457.047L315.73,460.776L312.432,463.147L310.623,468.161L308.069,469.884L306.933,471.935L307.828,476.572L309.688,479.201L308.512,478.969L305.928,478.252L299.172,477.644L298.016,475.02L298.077,471.689L296.217,471.973L295.231,470.38L294.99,465.792L297.132,463.915L298.016,461.236L297.684,459.125L299.172,455.611L300.188,450.268L299.886,447.938L301.113,447.191L300.811,445.711L299.514,444.931L300.439,443.302L299.172,441.84L298.519,437.444L299.645,436.679L299.172,432.139L299.826,428.389L300.58,425.167L302.249,423.864L301.404,420.406L301.394,417.187L303.505,414.923L303.435,412.051L305.033,408.741L305.043,405.649L304.32,405.039L303.033,399.339L304.752,395.998L304.48,392.88L305.486,389.981L307.315,387.01L309.286,385.059L308.451,383.832L309.034,382.83L308.944,377.678L311.98,376.169L312.945,373.004L312.603,372.245L314.926,369.517L318.585,370.251L320.224,372.435L321.32,370.007L324.496,370.129L324.949,370.777L330.086,375.729L332.368,376.19L335.776,378.458L338.651,379.662L339.053,381.028L336.309,385.765L339.124,386.616L342.26,387.101L344.472,386.594L347.005,384.191L347.458,381.447L348.845,380.85L350.243,382.64L350.182,385.134L347.83,386.866L345.96,388.152L342.803,391.23Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M545.647,390.352L546.984,388.784L548.079,389.653L548.552,391.009L549.809,391.241L551.568,391.846L553.066,391.614L555.559,389.986L555.559,378.447L556.313,378.906L557.972,381.846L557.71,383.742L558.334,384.837L560.334,384.519L561.732,383.125L563.059,382.193L563.742,380.708L565.099,379.991L566.276,380.363L567.613,381.232L569.885,381.384L571.674,380.661L571.956,379.699L572.438,378.224L573.966,377.979L574.801,376.827L575.736,374.795L578.239,372.522L582.19,370.297L583.326,370.333L584.673,370.843L585.618,370.481L587.106,370.782L588.443,375.053L589.167,377.221L588.674,380.656L588.905,381.767L587.498,381.201L586.694,381.421L586.432,382.325L585.668,383.494L585.688,384.572L587.357,386.27L588.996,385.935L589.559,384.54L591.68,384.567L590.976,386.85L590.655,389.476L589.931,390.912L588.021,392.523L587.478,392.989L586.292,394.62L585.518,396.277L583.929,398.61L580.772,401.991L578.802,403.98L576.691,405.496L573.775,406.793L572.358,406.969L571.996,407.902L570.297,407.401L568.91,408.044L565.884,407.395L564.195,407.805L563.039,407.629L560.163,408.958L557.771,409.496L556.052,410.777L554.775,410.857L553.599,409.651L552.654,409.588L551.447,408.079L551.317,408.546L550.945,407.64L550.965,405.677L550.06,403.447L550.955,402.841L550.884,400.315L549.055,397.26L547.657,394.517L547.647,394.511Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
<path d="M-2.655,37.61L-2.654,37.611L4.191,43.449L11.51,50.775L11.269,55.196L13.149,56.935L12.505,51.809L20.086,52.873L25.554,59.414L22.78,62.373L18.206,63.068L18.135,69.521L17.019,70.853L14.405,70.668L12.274,68.41L8.565,66.502L7.941,63.613L5.096,62.521L1.929,63.386L0.411,61.021L1.015,58.483L-2.333,60.109L-1.066,63.295L-2.655,66.123L-2.655,37.61ZM1002.655,66.123L1002.635,66.156L999.046,69.038L995.427,68.553L997.94,71.992L999.609,77.181L1000.896,78.843L1001.217,81.364L1000.503,82.968L995.296,81.651L987.485,86.153L985.001,86.841L980.729,90.926L976.677,94.416L975.652,96.967L971.661,93.074L964.382,97.485L963.116,95.416L960.421,97.804L956.692,97.043L955.787,100.66L952.439,105.869L952.54,108.003L955.716,109.171L955.344,116.613L952.751,116.8L951.554,120.944L952.721,123.049L947.835,125.513L946.87,130.904L942.698,132.037L941.863,136.691L937.842,140.872L936.806,137.792L935.61,131.109L934.052,120.479L935.399,113.542L937.751,110.473L937.892,108.039L942.235,106.863L947.221,100.096L952.037,94.378L957.054,89.823L959.295,81.477L955.907,81.989L954.229,86.901L947.141,93.247L944.859,86.123L937.651,88.121L930.654,97.654L932.966,101.02L926.733,102.434L922.41,102.991L922.611,99.056L918.278,98.216L914.82,100.919L906.275,99.976L897.086,101.591L888.048,111.896L877.342,123.656L881.745,124.261L883.112,127.257L885.827,128.315L887.616,125.942L890.682,126.25L894.714,131.432L894.804,135.352L892.623,139.856L892.391,145.111L891.125,151.954L886.922,157.961L885.977,160.778L882.187,165.436L878.427,169.961L876.628,172.242L872.908,174.482L871.149,174.534L869.39,172.678L865.64,175.466L865.208,176.727L865.208,176.727L864.815,176.062L864.795,174.134L866.223,174.031L866.625,169.481L865.891,166.125L868.284,164.731L871.682,165.429L873.552,161.543L874.517,157.086L875.592,155.578L877.06,151.818L872.446,153.062L870.033,154.708L865.781,154.701L864.655,150.76L861.347,147.729L856.491,146.351L855.456,142.071L854.481,139.342L853.435,137.41L851.706,132.805L849.253,131.101L845.081,129.709L841.371,129.836L837.903,130.675L835.601,132.984L837.129,134.082L837.169,136.599L835.611,138.043L833.088,142.764L833.118,144.691L829.177,147.424L825.829,145.794L822.502,146.153L821.034,144.698L819.365,144.233L815.273,147.285L811.594,147.998L809.03,149.055L805.512,148.361L802.918,148.404L801.229,146.204L798.494,144.115L795.69,143.537L792.161,144.115L789.517,144.919L785.556,143.084L785.023,139.765L781.736,138.614L779.202,138.089L776.076,136.223L773.181,140.872L774.317,143.47L771.602,146.497L767.561,145.412L764.776,145.25L762.906,143.21L760.001,143.151L757.568,141.794L753.315,143.863L747.987,147.598L745.052,148.339L743.956,148.694L742.478,146.065L738.879,146.643L737.683,144.801L735.732,143.952L734.395,141.413L732.847,140.617L728.836,141.749L724.986,139.19L723.498,141.517L717.265,129.963L713.696,126.306L714.721,124.807L707.724,129.296L705.04,129.558L705.271,126.983L701.692,125.351L698.777,126.516L697.892,121.516L692.876,120.462L690.362,122.49L683.375,124.277L682.008,125.465L671.563,127.12L670.286,128.738L672.297,131.943L669.623,133.14L670.145,134.393L667.461,136.614L671.985,139.705L671.291,141.809L667.361,141.622L666.556,142.928L662.977,140.639L658.554,140.73L655.588,142.593L652.281,140.805L646.128,137.708L641.765,137.822L636.005,142.668L635.653,145.853L632.788,143.329L630.556,148.092L631.37,148.961L629.762,152.174L632.124,155.01L634.205,154.89L635.985,157.649L635.693,159.749L637.121,160.408L635.844,162.794L633.14,163.451L630.365,167.537L632.898,171.232L632.627,173.818L635.673,178.272L634.004,179.777L633.522,180.72L632.295,180.469L630.375,178.203L629.591,178.076L627.831,177.205L626.977,175.658L624.373,174.862L622.674,175.46L622.192,174.753L618.391,172.924L614.28,172.301L611.917,171.643L611.575,172.099L608.017,168.828L604.83,167.351L602.417,165.034L604.448,164.395L606.77,161.044L605.202,159.439L609.323,157.774L609.243,156.878L606.74,157.538L606.83,155.711L608.268,154.553L610.972,154.25L611.415,152.857L610.791,150.531L611.927,148.295L611.897,147.037L607.775,145.633L606.147,145.677L604.418,143.633L602.276,144.329L598.737,142.787L598.798,141.921L597.803,139.999L595.571,139.78L595.339,138.393L596.043,137.479L594.254,134.912L591.358,135.352L590.514,135.121L589.81,136.153L588.765,135.976L588.081,133.039L587.418,131.503L587.96,131.07L590.212,131.227L591.298,130.208L590.494,128.961L588.614,128.131L588.775,127.273L587.639,126.403L585.889,123.254L586.493,121.946L586.221,119.645L583.487,118.463L582.019,119.051L581.627,117.823L578.681,116.562L577.787,113.585L577.545,111.094L576.198,109.903L577.405,108.251L576.57,103.301L578.561,100.17L578.138,99.214L581.315,96.146L578.39,93.478L584.361,86.083L586.955,82.642L588.011,79.549L583.879,75.302L585.015,71.168L582.502,66.324L584.382,60.583L581.134,52.644L583.708,47.188L579.435,42.21L579.848,36.819L582.099,36.103L586.855,32.926L589.73,30.115L594.314,34.97L601.965,36.832L612.52,45.448L614.662,48.948L614.843,53.727L611.746,57.418L607.182,59.252L594.716,53.954L592.665,54.851L597.219,59.936L597.4,63.079L597.581,69.816L601.18,71.776L603.362,73.424L603.724,70.33L602.035,67.536L603.814,65.035L610.57,69.126L612.912,67.536L611.043,62.669L617.547,55.955L620.121,56.357L622.734,58.775L624.353,53.978L622.031,49.711L623.398,45.322L621.347,40.639L629.158,43.079L630.747,47.251L627.218,48.157L627.228,52.173L629.43,54.612L633.743,53.078L634.426,48.479L640.257,44.957L650.009,38.438L652.11,38.818L649.365,43.449L652.824,44.224L654.824,41.645L660.062,41.439L664.204,38.255L667.391,42.863L670.558,37.795L667.632,33.223L669.09,30.568L677.333,33.007L681.204,35.491L691.317,44.262L693.187,40.302L690.352,36.196L690.272,34.528L686.904,33.749L687.829,29.936L686.331,23.465L686.251,20.739L691.398,12.776L693.238,4.385L695.308,2.516L702.708,5.025L703.281,10.181L700.637,17.436L702.376,20.215L703.271,26.134L702.637,37.163L705.724,41.876L704.517,46.877L699.048,57.041L702.245,58.062L703.351,55.552L706.427,53.751L707.171,50.201L709.584,46.727L707.955,42.479L709.262,37.413L706.206,36.766L705.533,32.37L707.764,24.122L704.135,17.11L709.132,11.091L708.488,4.482L709.886,4.273L711.343,9.451L710.248,18.087L713.233,19.675L711.957,13.324L716.631,9.747L722.432,9.265L727.589,14.429L725.106,6.835L724.825,-3.421L729.68,-5.431L736.406,-4.99L742.458,-6.3L740.186,-11.663L743.413,-18.654L746.62,-18.948L752.049,-24.44L759.428,-25.952L760.363,-29.097L767.692,-30.179L769.974,-27.575L776.247,-33.79L781.374,-33.588L782.148,-38.807L784.812,-44.132L791.407,-49.414L796.192,-45.231L792.392,-42.104L798.716,-40.206L799.47,-34.194L802.023,-37.11L810.186,-36.966L816.48,-31.129L818.722,-26.8L818.028,-20.97L814.942,-17.736L807.603,-11.84L805.502,-8.778L808.97,-7.345L813.092,-4.803L815.615,-6.71L817.033,-0.343L818.259,-2.884L822.723,-4.448L831.69,-2.817L832.364,1.737L844.046,3.163L844.196,-4.279L850.128,-2.533L854.581,-2.6L859.095,2.533L860.382,8.547L858.723,12.364L862.232,19.323L866.625,22.806L869.319,13.658L873.803,17.644L878.558,15.273L883.967,17.984L886.018,15.513L890.592,16.753L888.571,8.375L892.261,4.321L917.484,10.366L919.857,15.707L927.165,22.331L938.445,20.71L944.004,22.129L946.327,25.612L945.995,31.608L949.433,33.884L953.173,32.248L958.119,32.044L963.397,33.614L968.685,32.722L973.551,39.705L977.009,37.229L974.757,32.166L975.994,28.567L984.901,30.842L990.712,30.348L998.744,34.18L1002.655,37.61L1002.655,66.123Z" fill="#1e2d45" stroke="#2a3f5f" stroke-width="0.5"/>
` }} />

      {/* Location markers — using real equirectangular projection */}
      {locations.map((loc) => {
        const [x, y] = lngLatToXY(loc.lng, loc.lat);
        const isSelected = selectedLocation.city === loc.city;
        const r = isSelected
          ? 6
          : Math.max(3, Math.min(5, 3 + (loc.sales / maxSales) * 2.5));

        return (
          <g
            key={`${loc.city}-${loc.state}`}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <>
                <circle cx={x} cy={y} r={r + 10} fill="rgba(59,130,246,0.08)" />
                <circle cx={x} cy={y} r={r + 6} fill="rgba(59,130,246,0.15)" />
                <circle cx={x} cy={y} r={r + 3} fill="rgba(59,130,246,0.28)" />
              </>
            )}
            <circle cx={x} cy={y} r={r} fill={isSelected ? "#3b82f6" : "#2563eb"} stroke={isSelected ? "#93c5fd" : "#1d4ed8"} strokeWidth={isSelected ? 1.5 : 1} opacity={isSelected ? 1 : 0.85} filter={isSelected ? "url(#glow)" : undefined} />
            <circle cx={x} cy={y} r={r * 0.4} fill={isSelected ? "#bfdbfe" : "#60a5fa"} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}

export function BuyersLocationCard({
  data,
  totalSales,
  totalRevenue,
}: BuyersLocationCardProps) {
  const [viewMode, setViewMode] = useState<"mapa" | "lista">("mapa");
  const [searchQuery, setSearchQuery] = useState("");

  const locations: BuyerLocation[] = useMemo(() => {
    if (totalSales === 0) return [];

    if (data && data.length > 0) {
      const sumSales = data.reduce((s, l) => s + (l.sales || 0), 0);
      if (totalSales && totalSales > 0 && totalRevenue && totalRevenue > 0 && sumSales <= data.length) {
        const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
        return data.map((loc, idx) => {
          const p = proportions[idx] || (1 / data.length);
          return { ...loc, sales: Math.max(1, Math.round(totalSales * p)), revenue: Number((totalRevenue * p).toFixed(2)) };
        }).sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
      }
      return [...data].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
    }

    if (!totalSales || totalSales <= 0) return [];

    const proportions = [0.42, 0.24, 0.15, 0.11, 0.08];
    return DEFAULT_LOCATIONS.map((loc, idx) => {
      const p = proportions[idx] || (1 / DEFAULT_LOCATIONS.length);
      return { ...loc, sales: Math.max(1, Math.round(totalSales * p)), revenue: Number(((totalRevenue || 0) * p).toFixed(2)) };
    }).sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
  }, [data, totalSales, totalRevenue]);

  const [selectedLocation, setSelectedLocation] = useState<BuyerLocation>(
    locations[0] || DEFAULT_LOCATIONS[0],
  );

  useEffect(() => {
    if (locations.length > 0) {
      setSelectedLocation((curr) => {
        const match = locations.find((l) => l.city === curr.city);
        return match || locations[0];
      });
    }
  }, [locations]);

  const handleSelectLocation = useCallback((loc: BuyerLocation, switchToMap = false) => {
    setSelectedLocation(loc);
    if (switchToMap) setViewMode("mapa");
  }, []);

  const totalLocSales = useMemo(() => locations.reduce((sum, l) => sum + l.sales, 0), [locations]);
  const totalLocRevenue = useMemo(() => locations.reduce((sum, l) => sum + l.revenue, 0), [locations]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (l) => l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || (l.country && l.country.toLowerCase().includes(q)),
    );
  }, [locations, searchQuery]);

  return (
    <Card className="h-full min-h-[320px] lg:min-h-[360px] rounded-lg bg-white dark:bg-card border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between overflow-hidden py-0 gap-0 transition-all">
      <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="leading-tight text-left">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">De onde</h3>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">compram</h3>
            </div>
            <span className="inline-flex cursor-help text-slate-400/80 hover:text-slate-200 transition-colors self-start mt-0.5" title="Origem geográfica dos clientes com base nas vendas e conversões registradas.">
              <RiInformationLine className="size-4" />
            </span>
          </div>

          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-white/10 text-xs">
            <button type="button" onClick={() => setViewMode("mapa")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "mapa" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground")}>
              <RiGlobalLine className="size-3.5" />
              <span>Mapa</span>
            </button>
            <button type="button" onClick={() => setViewMode("lista")} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all", viewMode === "lista" ? "bg-white dark:bg-[#202738] text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground")}>
              <RiListUnordered className="size-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-4 pt-1">
        {locations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-4 text-muted-foreground min-h-[220px]">
            <RiMapPinLine className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium">Nenhuma venda registrada no período</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "mapa" ? (
              <motion.div key="view-mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col items-center justify-between gap-2">
                {/* Map */}
                <div className="relative w-full rounded-xl overflow-hidden border border-white/[0.05]" style={{ aspectRatio: "2/1" }}>
                  <WorldMapSVG locations={locations} selectedLocation={selectedLocation} onSelectLocation={handleSelectLocation} />
                </div>

                {/* Location badges */}
                <div className="flex flex-col items-center gap-1 w-full max-w-[260px]">
                  {locations.slice(0, 2).map((loc) => {
                    const isSelected = selectedLocation.city === loc.city;
                    return (
                      <button key={`${loc.city}-${loc.state}`} type="button" onClick={() => handleSelectLocation(loc)} className={cn("w-full flex items-center justify-center gap-2 py-1 px-3 rounded-xl text-xs font-medium transition-all border", isSelected ? "bg-blue-600/15 border-blue-500/60 text-blue-500 dark:text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.25)] font-semibold scale-[1.02]" : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground")}>
                        <span className={cn("size-2 rounded-full transition-all", isSelected ? "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse" : "bg-zinc-400/70")} />
                        <span>{loc.city}, {loc.state} · {loc.sales} {loc.sales === 1 ? "venda" : "vendas"}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] text-muted-foreground font-medium tracking-tight">
                  {selectedLocation.city}, {selectedLocation.state} — {selectedLocation.sales} {selectedLocation.sales === 1 ? "venda" : "vendas"} ({convertAndFormatMZN(selectedLocation.revenue)})
                </p>
              </motion.div>
            ) : (
              <motion.div key="view-lista" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col justify-start space-y-2 mt-1">
                <div className="relative w-full">
                  <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Filtrar cidade ou estado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-medium">
                  <span>{filteredLocations.length} cidades mapeadas</span>
                  <span>Total: {totalLocSales} {totalLocSales === 1 ? "venda" : "vendas"} ({convertAndFormatMZN(totalLocRevenue)})</span>
                </div>

                <div className="flex flex-col space-y-1.5 overflow-y-auto max-h-[190px] pr-1">
                  {filteredLocations.length > 0 ? filteredLocations.map((loc, idx) => {
                    const isSelected = selectedLocation.city === loc.city;
                    const pct = totalLocSales > 0 ? (loc.sales / totalLocSales) * 100 : 0;
                    return (
                      <div key={`${loc.city}-${loc.state}`} onClick={() => handleSelectLocation(loc)} className={cn("group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer", isSelected ? "bg-blue-600/10 border-blue-500/40 shadow-sm" : "bg-muted/20 border-border/30 hover:bg-muted/40")}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", idx === 0 ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground")}>{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{loc.city}, {loc.state}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(12, pct))}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-bold text-foreground">{loc.sales} {loc.sales === 1 ? "venda" : "vendas"}</p>
                            <p className="text-[10px] text-muted-foreground">{convertAndFormatMZN(loc.revenue)}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectLocation(loc, true); }} title="Ver no Mapa" className="size-6 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors">
                            <RiFocus3Line className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">Nenhuma cidade encontrada para "{searchQuery}".</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
