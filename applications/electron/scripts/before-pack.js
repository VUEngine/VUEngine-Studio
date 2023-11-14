exports.default = async function (context) {
    context.packager.appInfo.versionDashes =
        context.packager.appInfo.version.replace(/\./g, '-');
};
