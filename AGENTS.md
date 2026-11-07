<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep imported LomusTrack screens under src/features/lomustrack and use TanStack file routes; the original React Router bootstrap is not compatible with this project.
- Load the imported browser-dependent providers and screens lazily behind ClientOnly to keep SSR safe.
- The Python service is preserved as reference source, not deployed; demo mode must never fall through to live API calls or imply persisted changes.
- For any third-party API that authenticates by exchanging a client ID/secret for an expiring token, keep the ID/secret as the stored credential and read it only inside a server boundary; never persist the expiring token itself as the durable credential.
