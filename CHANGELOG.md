
## v0.6.10 (2020-03-14)

### Added
* .gif sample usage in `README.md`

## v0.6.9 (2020-03-14)

## Fixed
* uncaught error on drop without active pane

### Changes
* chore, renames variables and functions.
* replaced release names with version numbers in `CHANGELOG.md`.

## v0.6.8 (2020-03-14)

### Changes
* removed test folder.

## v0.6.0 (2020-02-28)

### Updates
* lib/main.js refactored.

### Fixes
* Import fires upon dragging panes fixed.

## v0.5.0 (2018-12-17)

### Fixes
* Entire package moved to lib directory.
* `config` and retrieval moved to `package-config`.

### Added
* Added warning and error notifications if import file is not a typescript file or vice versa.

## v0.4.0 (2018-12-12)

### Fixes
* **cursorPosition**: moved to `calculatePath(...)` to remove additional declaration in `toImportCursor(...)` and `toImportPositionBottom(...)`.
* `initState(...)` removal.

### Added
* Toggle include export name.
* Toggle add semicolon in import statements.
* Close all active notifications on ESC key.

## v0.3.1 (2018-11-23)

### Added
*

* Users can now choose whether to append import line at the end of import list or before.
* Users can now append imports on the selected line (mouse).
* Users can now choose between single quotes and double quotes.

## v0.1.0 - First Release
* Every feature added
* Every bug fixed
