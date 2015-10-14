// Generated by CoffeeScript 1.9.3
var Commit, async, buildCommitDateHash, cheerio, cozydb, fetcher, fs, getEvents, localization, log, logCommits, moment, request, requestJson;

cozydb = require('cozydb');

requestJson = require('request-json');

request = require('request');

moment = require('moment');

cheerio = require('cheerio');

fs = require('fs');

async = require('async');

fetcher = require('../lib/fetcher');

localization = require('../lib/localization_manager');

log = require('printit')({
  prefix: "Github",
  date: true
});

Commit = require('../models/commit');

module.exports = {
  name: "Github Commits",
  slug: "githubcommits",
  description: 'konnector description github commits',
  vendorLink: "https://www.github.com/",
  fields: {
    login: "text",
    password: "password"
  },
  models: {
    commit: Commit
  },
  init: function(callback) {
    return callback();
  },
  fetch: function(requiredFields, callback) {
    log.info("Import started");
    return fetcher["new"]().use(getEvents).use(buildCommitDateHash).use(logCommits).args(requiredFields, {}, {}).fetch(function(err, fields, commits, data) {
      var localizationKey, notifContent, options;
      log.info("Import finished");
      notifContent = null;
      if (commits && commits.numImportedCommits > 0) {
        localizationKey = 'notification github commits';
        options = {
          smart_count: commits.numImportedCommits
        };
        notifContent = localization.t(localizationKey, options);
      }
      return callback(err, notifContent);
    });
  }
};

getEvents = function(requiredFields, commits, data, next) {
  var client, pass, path, username;
  client = requestJson.createClient('https://api.github.com');
  username = requiredFields.login;
  pass = requiredFields.password;
  console.log(requiredFields);
  client.setBasicAuth(username, pass);
  path = "users/" + username + "/events?page=";
  data.commits = [];
  log.info("Fetch commits sha from events...");
  return async.eachSeries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(page, callback) {
    return client.get(path + page, function(err, res, events) {
      var commit, event, i, j, len, len1, ref;
      if (err == null) {
        if (events.message !== 'Bad credentials') {
          log.info("Fetch events page " + page + "...");
          for (i = 0, len = events.length; i < len; i++) {
            event = events[i];
            if (event.type === 'PushEvent') {
              ref = event.payload.commits;
              for (j = 0, len1 = ref.length; j < len1; j++) {
                commit = ref[j];
                data.commits.push(commit);
              }
            }
          }
          return callback();
        } else {
          return callback('bad credentials');
        }
      } else {
        log.error(err);
        return callback();
      }
    });
  }, function(err) {
    log.info("All events data fetched.");
    return next(err);
  });
};

buildCommitDateHash = function(requiredFields, entries, data, next) {
  entries.commitHash = {};
  return Commit.all(function(err, commits) {
    var commit, i, len;
    if (err) {
      log.error(err);
      return next(err);
    } else {
      for (i = 0, len = commits.length; i < len; i++) {
        commit = commits[i];
        entries.commitHash[commit.sha] = true;
      }
      return next();
    }
  });
};

logCommits = function(requiredFields, entries, data, next) {
  var client, numImportedCommits, pass, username;
  client = requestJson.createClient('https://api.github.com');
  username = requiredFields.login;
  pass = requiredFields.password;
  numImportedCommits = 0;
  client.setBasicAuth(username, pass);
  return async.eachSeries(data.commits, function(commit, callback) {
    var path;
    path = commit.url.substring('https://api.github.com/'.length);
    if ((commit != null) && entries.commitHash[commit.sha]) {
      log.info("Commit " + commit.sha + " not saved: already exists.");
      return callback();
    } else {
      return client.get(path, function(err, res, commit) {
        var parent;
        if (err) {
          log.error(err);
          return callback();
        } else if ((commit == null) || (commit.commit == null) || (commit.author == null)) {
          if (commit != null) {
            log.info("Commit not saved: no metadata.");
          } else {
            log.info("Commit " + commit.sha + " not saved: no metadata.");
          }
          return callback();
        } else if (commit.author.login !== username) {
          log.info(("Commit " + commit.sha + " not saved: ") + ("user is not author (" + commit.author.login + ")."));
          return callback();
        } else {
          log.info("Saving commit " + commit.sha + "...");
          parent = null;
          if (commit.parents.length > 0) {
            parent = commit.parents[0].sha;
          }
          data = {
            date: commit.commit.author.date,
            sha: commit.sha,
            parent: parent,
            url: commit.url,
            author: commit.commit.author.name,
            email: commit.commit.author.email,
            message: commit.commit.message,
            tree: commit.commit.tree.sha,
            additions: commit.stats.additions,
            deletions: commit.stats.deletions,
            files: commit.files
          };
          numImportedCommits++;
          return Commit.create(data, function(err) {
            if (err) {
              log.error(err);
            } else {
              log.info("Commit " + commit.sha + " saved.");
            }
            return callback();
          });
        }
      });
    }
  }, function(err) {
    entries.numImportedCommits = numImportedCommits;
    return next();
  });
};
