# Walkthrough of Codebase Overwrite

We have successfully replaced the codebase of `en-tec-hr-simple` with `hr-harmony-system` locally and pushed the changes to the remote repository.

## Actions Taken

1. **Cloned Source Repository:** Cloned `hr-harmony-system` into a temporary folder `temp_hr_harmony`.
2. **Cleaned Workspace:** Removed all existing files in the `en-tec-hr-simple` workspace, preserving only the `.git` folder (to retain git history/remote configuration).
3. **Copied Codebase:** Moved all files from `temp_hr_harmony` into the workspace (excluding the source repository's `.git` folder).
4. **Cleaned Up:** Deleted the temporary folder.
5. **Committed Changes:** Staged all changes and committed them locally.
6. **Pulled Remote Updates:** Performed a rebase pull to incorporate a remote `README.md` file update.
7. **Pushed to GitHub:** Successfully pushed the changes to `https://github.com/bandarwardi/en-tec-hr-simple` main branch.

The remote repository is now fully up to date with the new codebase.
