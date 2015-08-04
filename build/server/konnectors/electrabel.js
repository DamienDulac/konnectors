// Generated by CoffeeScript 1.9.3
var Bill, File, cheerio, cozydb, fetcher, filterExisting, fs, linkBankOperation, localization, log, logIn, moment, parsePage, request, requestJson, saveDataAndFile;

cozydb = require('cozydb');

requestJson = require('request-json');

request = require('request');

moment = require('moment');

cheerio = require('cheerio');

fs = require('fs');

File = require('../models/file');

fetcher = require('../lib/fetcher');

filterExisting = require('../lib/filter_existing');

saveDataAndFile = require('../lib/save_data_and_file');

linkBankOperation = require('../lib/link_bank_operation');

localization = require('../lib/localization_manager');

log = require('printit')({
  prefix: "Electrabel",
  date: true
});

Bill = require('../models/bill');

module.exports = {
  name: "Electrabel",
  slug: "electrabel",
  description: 'konnector description electrabel',
  vendorLink: "https://www.electrabel.be/",
  fields: {
    login: "text",
    password: "password",
    folderPath: "folder"
  },
  models: {
    bill: Bill
  },
  init: function(callback) {
    var map;
    map = function(doc) {
      return emit(doc.date, doc);
    };
    return Bill.defineRequest('byDate', map, function(err) {
      return callback(err);
    });
  },
  fetch: function(requiredFields, callback) {
    log.info("Import started");
    return fetcher["new"]().use(logIn).use(parsePage).use(filterExisting(log, Bill)).use(saveDataAndFile(log, Bill, 'electrabel', ['facture'])).use(linkBankOperation({
      log: log,
      model: Bill,
      identifier: 'electrabel',
      dateDelta: 10,
      amountDelta: 0.1
    })).args(requiredFields, {}, {}).fetch(function(err, fields, entries) {
      var localizationKey, notifContent, options, ref;
      log.info("Import finished");
      notifContent = null;
      if ((entries != null ? (ref = entries.filtered) != null ? ref.length : void 0 : void 0) > 0) {
        localizationKey = 'notification electrabel';
        options = {
          smart_count: entries.filtered.length
        };
        notifContent = localization.t(localizationKey, options);
      }
      return callback(err, notifContent);
    });
  }
};

logIn = function(requiredFields, billInfos, data, next) {
  var billUrl, form, loginUrl, options;
  loginUrl = "https://www.electrabel.be/fr/particulier/login";
  billUrl = "https://www.electrabel.be/fr/particulier/espace-client/facture/l.a/eservices/private/billing/billviewer?loadedFromPage=true&fragmentName=invoiceListFragment&contractAccountID=";
  form = {
    "l.url": "/fr/particulier/espace-client/espace-client-en-ligne",
    "l.userName": requiredFields.login,
    "l.password": requiredFields.password
  };
  options = {
    method: 'POST',
    form: form,
    jar: true,
    url: loginUrl
  };
  return request(options, function(err, res, body) {
    var isNoLocation, isNot302, location;
    isNoLocation = res.headers.location == null;
    isNot302 = res.statusCode !== 302;
    if ((err != null) || isNoLocation || isNot302) {
      log.error("Authentification error");
      return next('bad credentials');
    } else {
      location = res.headers.location;
      options = {
        method: 'GET',
        jar: true,
        url: location
      };
      return request(options, function(err, res, body) {
        var $, clientID;
        if (err) {
          return next(err);
        } else {
          $ = cheerio.load(body);
          clientID = $('#contract-account-id').attr('value');
          options = {
            method: 'GET',
            jar: true,
            url: billUrl + clientID
          };
          return request(options, function(err, res, body) {
            if (err != null) {
              return next(err);
            } else {
              data.html = body;
              data.clientID = clientID;
              request.cookie("contractAccountID=" + clientID);
              return next();
            }
          });
        }
      });
    }
  });
};

parsePage = function(requiredFields, bills, data, next) {
  var $;
  bills.fetched = [];
  if (data.html == null) {
    return next();
  }
  $ = cheerio.load(data.html);
  $('tr').each(function() {
    var amount, bill, billID, date, pdfUrl;
    $ = cheerio.load($(this).html());
    amount = $('td[class=last]').text();
    if (amount.length !== 0) {
      amount = amount.replace(' €', '');
      amount = amount.replace(',', '.');
      amount = parseFloat(amount);
      billID = $('a').find('span').text();
      pdfUrl = "https://www.electrabel.be/eservices/private/billing/billviewer?invoiceId=" + billID + "&contractAccountID=" + data.clientID;
      date = $('td[class=first]').text();
      date = moment(date, 'DD-MM-YYYY', 'fr');
      bill = {
        amount: amount,
        date: date,
        vendor: 'Electrabel',
        pdfurl: pdfUrl,
        type: 'energy'
      };
      return bills.fetched.push(bill);
    }
  });
  return next();
};
