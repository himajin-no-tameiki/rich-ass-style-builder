# static

Everything inside this folder can be referenced using `__static` both in environment and production environments.

This folder is set as the static directory by `staticSourceDirectory` option in `electron-webpack.json`. electron-webpack sees this option and set the `extraResources` option for electron-builder

# See also

- https://webpack.electron.build/using-static-assets
- https://www.electron.build/configuration/contents#extraresources
