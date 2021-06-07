var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var moment = require('moment');
var dateFormat = require('dateformat');
var jade = require('jade');
var rp = require('request-promise');
var Buffer = require('buffer').Buffer;

function getReportName(repo, owner) {
    return [
        owner,
        '_',
        repo,
        '-',
        dateFormat(new Date(), 'yyyymdd-HHMMss'),
        '.html'
    ].join('');
}

function generateAuthorization(token) {
    return 'Basic ' + new Buffer(token + ':x-oauth-basic').toString('base64');
}

module.exports = {
    generate: function(config) {

        var options = {
            uri: 'https://api.github.com/repos/' + config.owner + '/' + config.repo + '/branches?state=all',
            headers: {
                'User-Agent': 'github-branch-reports'
            }
        };

        if (config.token) {
            options.headers['Authorization'] = generateAuthorization(config.token);
        }

        rp(options)
            .then(function(result) {
                var branchList = JSON.parse(result);
                var runDate = moment();
                var update = 

                //console.log(branchList)

                var branches = _.map(branchList, function (branch){
                    return {
                        _name: branch.name
                    }
                });
                
                //console.log(branches);
                

                var templatePath = path.join(__dirname, 'report.jade');
                var template = jade.compileFile(templatePath);
                var context = {
                    _branches: branches,
                    runDate: runDate,
                    repo: config.repo
                };

                console.log(context);

                var html = template(context);

                var fileName = getReportName(config.repo, config.owner);
                fs.writeFile(fileName, html, function(err) {
                    if (err) {
                        console.log("ERROR-------------->>", err);
                    } else {
                        console.log('Generated branch report %s', fileName);
                    }
                });
            })
            .catch(function(reason) {
                console.log(reason);
            });
    }
};