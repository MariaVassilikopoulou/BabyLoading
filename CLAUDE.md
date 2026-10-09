# Project rules — BabyLoading

## Boundary
Project root (the ONLY place you may write):
C:\Users\vasil\ProjectsNEW\BabyLoading
(Git Bash: /c/Users/vasil/ProjectsNEW/BabyLoading · WSL: /mnt/c/Users/vasil/ProjectsNEW/BabyLoading)

Never create, modify, move, rename, or delete anything outside the root, including other folders in ProjectsNEW. Being related to this project does not make an outside file safe to touch.
Before any write or delete, resolve the target to an absolute path and confirm it is inside the root. Watch for `..`, symlinks, and env-var paths (%USERPROFILE%, ~). If unsure, stop and ask.

## Allowed without asking
- Reading and editing project files for the task I gave you
- Running installed tools (node, npm, python, git)
- Reading environment variables and global config
- Project-local installs (e.g. `npm install`), including caches and temp files tools write automatically

## Ask first
- Anything that writes outside the root: global installs, global git config, env vars, credentials, other folders
- Deleting or renaming any file, unless I requested that specific deletion
- Any cleanup: caches, build output, "unused" files, reorganizing
- Adding or removing dependencies
- Changes touching more than 5 files

When asking, state: what changes, which files, what is deleted or renamed, and whether anything outside the root is involved.

## Git
Never run `git commit` or `git push`. I do both manually.
Read-only commands are allowed: `status`, `diff`, `log`, `branch`.
Any other command that changes the repository (reset, clean, checkout, switch, restore, rebase, merge, stash, branch -D) needs my approval first, with an explanation of what could be lost.

Suggest a commit when:
- a feature, fix, or logical unit of work is finished and working
- before a risky or large change, so I have a restore point
- before changing dependencies or config

Include a short summary, the changed files, and a suggested commit message.

Suggest a push when commits are done and the project builds and works, or at the end of a session. Never suggest pushing broken or untested code.

## When unsure
Stop and ask. Don't guess.