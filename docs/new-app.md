# Make a new app

Creates a ready-to-build Microsoft Fabric data app with the RNZ look, components, rules and brand check already in place.

## Steps

1. In VS Code, open Copilot Chat in **Agent** mode and type `/rnz-new`.
2. Answer the questions:
   - **App name:** lowercase letters, numbers and hyphens, for example `pipeline-by-pillar`.
   - **Fabric workspace ID** (optional): the long ID after `/groups/` in the workspace's web address. Say you don't have it if you don't.
   - **Builder, QA and reporter agents:** yes or no to each. See [Agents](agents.md).
3. The tool creates the app in `C:\dev\APP-NAME`, checks the brand, makes the first commit and opens it in a new VS Code window.
4. In the new window, open Copilot Chat (**Agent** mode). If you added the builder, pick **rnz-builder** from the agent list. Then type:

   > Build this RNZ app. It's for [who] to see [what]. Model: [semantic model share link]. Pillar: [pillar or none].

## What you get

- The RNZ theme: colours, Frutiger then Arial, type sizes, charts and table styles.
- A kit of RNZ components, including the app frame with the RICOH lock-up.
- Rules and skills that Copilot and Claude Code follow automatically, so new screens stay on brand.
- A brand check (`npm run rnz:check`) that also runs before every deploy and stops a deploy with brand errors.

The look is fixed. The screens, layout within the RNZ patterns, and content are up to you.

## Next

- **Put it on GitHub:** Source Control > Publish Branch > choose **private**.
- **Deploy:** ask Copilot to deploy, or run `npx rayfin up` in the app folder.
- **Keep it current:** run `/rnz-update` after each RNZ release.

## Tips

- Keep apps outside OneDrive. `C:\dev` is the default for that reason.
- Use real data only. The rules stop Copilot inventing figures.
