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

                var brunchs = _.map(branchList, function(branch) {
                    return {
                        url: branch.html_url,
                        number: branch.number,
                        title: branch.title,
                        createdBy: branch.user.login,
                        createdAt: moment(branch.created_at),
                        //comments: issue.comments,
                        //closedAt: moment(branch.closed_at),
                        //body: issue.body,
                        //state: issue.state,
                        labels: _.map(branch.labels, function(label) {
                            return label.name;
                        })
                    }
                });

                //var openIssues = _.filter(issues, function(issue) {
                //    return issue.state === 'open';
                //});

                //var closedIssues = _.filter(issues, function(issue) {
                //    return issue.state === 'closed';
                //});

                var templatePath = path.join(__dirname, 'report.jade');
                var template = jade.compileFile(templatePath);
                var context = {
                    //openIssues: openIssues,
                    //closedIssues: closedIssues,
                    runDate: runDate,
                    repo: config.repo
                };
                var html = template(context);

                var fileName = getReportName(config.repo, config.owner);
                fs.writeFile(fileName, html, function(err) {
                    if (err) {
                        console.log(err);
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