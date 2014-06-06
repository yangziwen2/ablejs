/**
 * A grunt task that for optimize css files.
 */

module.exports = function(grunt) {
    'use strict';

    // node libs.
    var path = require('path');

    // internal libs.
    var file = require('../utils/file');
    var log = require('../utils/log');
    var cssbin = require('../utils/cssbin');
    var filemap = require('../common/filemap');

    var rmultilineCommentsExpr = /\/\*(?!\!)([\s\S]*?)\*\//g;
    var rcssPrefix = 'http://www.ablesky-a.com:8080/[^/]*/images/';

    var CSS_PLACEHOLDER = '%IMG_PATH%';

    /**
     * CSS_PLACEHOLDER <--> CSS_PREFIX_PATH
     */
    function replacePicPrefixInCSS(content, isReversed) {
        var toreplace = new RegExp(isReversed ? CSS_PLACEHOLDER : rcssPrefix, 'g');
        var newstring = isReversed ? '../images/' : CSS_PLACEHOLDER;

        return content.replace(toreplace, newstring);
    }

    function preProcessSourceContent(data) {
        // delete comments.
        data = data.replace(rmultilineCommentsExpr, '');
        // replace images path prefix.
        data = replacePicPrefixInCSS(data, false)

        return data;
    }

    grunt.registerMultiTask('opticss', 'A grunt task that for optimize css files.', function() {
        var options = this.options();
        var cwd = this.data.cwd;
        var dest = this.data.dest;

        this.files.forEach(function(element, i, array) {
            element.src.forEach(function(sourceIdentifier) {

                var sourcePath = path.join(cwd, sourceIdentifier);
                var sourceExtname = path.extname(sourcePath);
                var sourceContent, resultPath, map, minified;

                if (!file.exists(sourcePath)) {
                    log.warn('Source file "' + sourcePath + '" not found.');
                } else {
                    log.write('source css: ' + sourcePath.data + '\n');

                    sourceContent = preProcessSourceContent(file.read(sourcePath));
                    // find dependencies of the current courseContent manually
                    var dependencies = filemap.findDependencies(identifier, sourceContent);
                    // replace dependency in content.
                    sourceContent = filemap.processDepends(sourceContent, dependencies);
                    // the identifier key's value in "filemap" object.
                    map = filemap.updateMapAfterDependsProcessed(sourceIdentifier, sourceContent, dependencies);
                    // the file to be generated in dest dir.
                    resultPath = path.join(dest, map.fingerprint + sourceExtname);
                    // recovery previous img path replace.
                    sourceContent = replacePicPrefixInCSS(sourceContent, true);

                    log.write('result css: ' + resultPath.data + ' ...');

                    // compress file content.
                    minified = cssbin.minify(sourceContent, {
                        relativeTo: path.dirname(sourcePath) // to resolve relative @import rules
                    });

                    if (options.banner) {
                        minified = options.banner + minified;
                    }

                    file.write(resultPath, minified);
                    log.info('ok');
                }

            });

            filemap.save();
        });

    });

};