# Deploying Closure Compiler to NPM

*You now need yarn installed: https://yarnpkg.com/en/docs/install*

## Deploying new releases of the main compiler

 1. Update the compiler submodule pointer to the tagged release.
     * if not already done, update the compiler submodule
       `git submodule init && git submodule update`
     * change to the '/compiler' folder
     * `git checkout` the correct tag/commit (should be of the form `closure-compiler-parent-vYYYYMMDD`)
     * change back to the root folder and commit this change
 2. Run `yarn install` in the package root.
 3. Run `node_modules/.bin/lerna version {COMPILER_VERSION_NUMBER}.0.0`.
    The `COMPILER_VERSION_NUMBER` should not include the preceding `v` - example: 20181008.
    The command will ask you to verify that you wish to create new versions for each package.
    Once confirmed, version numbers will be committed, the commit tagged and changes pushed.

## Deploying changes to the package CLIs or plugins

Features and fixes to the packages in this repo need not wait for a main compiler release.
They can be published at any time if they are backwards compatible with the last major version.
Breaking changes should be deployed at the same time as a major compiler release.

 1. Run `yarn install`.
 2. Run `node_modules/.bin/lerna version`.
    The command will ask you to choose a new version number.
    Patch level versions should be used for fixing issues.
    Minor level versions should be used for new features that are backwards compatible.
    
## Verifying Publication Was Successful

The `lerna version` command will push a new tagged commit. Travis will automatically start building
this commit. Expand the `Deploying application` section at the bottom of the log. For each
successfully published package, a `✅ publish succeeded` line should be present. In addition,
the npm registry page for each package should list the newly published version.

Since the native images can only be build on their respective OS, whichever Travis build
finishes last will publish the main package as it waits until all dependent packages have
been published.

*Note: The lerna log file lines "lerna success published 5 packages" is misleading. Lerna will
succeed even if the package has already been published or failed to publish due to missing
dependencies.*
