# Maintainers

For whoever looks after the tool. The full rules are in the root `AGENTS.md`.

## Give someone access

GitHub > the repository > **Settings > Collaborators > Add people**, with read access. For a larger group, move the repository to a GitHub organisation and give a team read access. Then send them the [Quick start](quick-start.md).

## Make a release

1. Make the change on a new branch in your own clone (not in the `.rnz` copy).
2. Run the checks: in `templates/rnz-data-app`, `npm ci`, `npm run rnz:check`, `npx vitest run src` and `npm run build:fabric`. From the root, `node scripts/rnz-lock.mjs --verify`, `node scripts/test-skin.mjs` and `node scripts/test-agents.mjs`.
3. If you changed the template, bump the version (in `rnz/brand-manifest.json`, `package.json` and `rayfin-template.yml`) and run `node scripts/rnz-lock.mjs`.
4. Add a `CHANGELOG.md` entry.
5. Open a pull request. The **Template checks** must pass.
6. Merge, then tag the release from the terminal (`X.Y.Z` is the new version), naming the folder so the tag lands in the right repository:
   ```powershell
   git -C "$HOME/.rnz/rnz-fabric-apps" pull
   git -C "$HOME/.rnz/rnz-fabric-apps" tag vX.Y.Z
   git -C "$HOME/.rnz/rnz-fabric-apps" push origin vX.Y.Z
   ```
   Everyone gets the release the next time they run an `/rnz-` command.

## Test a branch before merging

Point your tool copy at the branch, test, then point it back:

```powershell
git -C "$HOME/.rnz/rnz-fabric-apps" fetch
git -C "$HOME/.rnz/rnz-fabric-apps" checkout BRANCH-NAME
# test with the /rnz- commands
git -C "$HOME/.rnz/rnz-fabric-apps" checkout main
```

## Rules that never change

- **Never rename or move a file.** Skills, scripts and other repositories use the exact names.
- **The RICOH logo is always the lock-up.** Never a logo-only file, never a cropped tagline, never a favicon.
- **The brand guide's source** is `ricoh-brand-methodology-v12.html` in the `rnz-ai-library` repository. Change it there first, then copy it into the template unchanged.
- **Self-contained.** The tool must never need the `rnz-ai-library` repository to run.
- **The skin changes values only.** Colours, fonts and font weights, never structure.
- **NZ English,** no em or en dashes in anything people read.

## Tips

- Run git commands for releases in the terminal with `git -C "folder"`, not through Copilot Chat. With several repositories open, Copilot can pick the wrong one.
- Pause OneDrive during branch switches and merges in OneDrive folders.
