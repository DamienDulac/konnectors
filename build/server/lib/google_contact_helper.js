// Generated by CoffeeScript 1.11.1
var CompareContacts, ContactHelper, GCH, PICTUREREL, https, im, log, request, url;

https = require('https');

im = require('imagemagick-stream');

url = require('url');

request = require('request-json');

ContactHelper = require('./contact_helper');

CompareContacts = require('./compare_contacts');

module.exports = GCH = {};

log = require('printit')({
  date: true
});

GCH.ACCOUNT_TYPE = 'com.google';

GCH.extractGoogleId = function(gEntry) {
  var parts, ref, uri;
  uri = (ref = gEntry.id) != null ? ref.$t : void 0;
  if (uri != null) {
    parts = uri.split('/');
    return parts[parts.length - 1];
  }
};

GCH.fromGoogleContact = function(gContact, accountName) {
  var adr, contact, email, ev, getTypeFragment, getTypePlain, i, iM, j, l, len, len1, len2, len3, len4, len5, len6, m, n, nameComponent, o, p, phone, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref17, ref18, ref19, ref2, ref20, ref21, ref22, ref23, ref24, ref3, ref4, ref5, ref6, ref7, ref8, ref9, rel, web, websites;
  if (gContact == null) {
    return;
  }
  contact = {
    docType: 'contact',
    fn: (ref = gContact.gd$name) != null ? (ref1 = ref.gd$fullName) != null ? ref1.$t : void 0 : void 0,
    org: gContact != null ? (ref2 = gContact.gd$organization) != null ? (ref3 = ref2[0]) != null ? (ref4 = ref3.gd$orgName) != null ? ref4.$t : void 0 : void 0 : void 0 : void 0,
    title: gContact != null ? (ref5 = gContact.gd$organization) != null ? (ref6 = ref5[0]) != null ? (ref7 = ref6.gd$orgTitle) != null ? ref7.$t : void 0 : void 0 : void 0 : void 0,
    bday: (ref8 = gContact.gContact$birthday) != null ? ref8.when : void 0,
    nickname: (ref9 = gContact.gContact$nickname) != null ? ref9.$t : void 0,
    note: (ref10 = gContact.content) != null ? ref10.$t : void 0,
    accounts: [
      {
        type: 'com.google',
        name: accountName,
        id: GCH.extractGoogleId(gContact),
        lastUpdate: (ref11 = gContact.updated) != null ? ref11.$t : void 0
      }
    ]
  };
  nameComponent = function(field) {
    var part, ref12, ref13;
    part = ((ref12 = gContact.gd$name) != null ? (ref13 = ref12[field]) != null ? ref13.$t : void 0 : void 0) || '';
    return part.replace(/;/g, ' ');
  };
  contact.n = (nameComponent('gd$familyName')) + ";";
  contact.n += (nameComponent('gd$givenName')) + ";";
  contact.n += (nameComponent('gd$additionalName')) + ";";
  contact.n += (nameComponent('gd$namePrefix')) + ";";
  contact.n += "" + (nameComponent('gd$nameSuffix'));
  getTypeFragment = function(component) {
    var ref12;
    return ((ref12 = component.rel) != null ? ref12.split('#')[1] : void 0) || component.label || 'other';
  };
  getTypePlain = function(component) {
    return component.rel || component.label || 'other';
  };
  contact.datapoints = [];
  ref12 = gContact.gd$email || [];
  for (i = 0, len = ref12.length; i < len; i++) {
    email = ref12[i];
    contact.datapoints.push({
      name: "email",
      pref: email.primary || false,
      value: email.address,
      type: getTypeFragment(email)
    });
  }
  ref13 = gContact.gd$phoneNumber || [];
  for (j = 0, len1 = ref13.length; j < len1; j++) {
    phone = ref13[j];
    contact.datapoints.push({
      name: "tel",
      pref: phone.primary || false,
      value: phone.$t,
      type: getTypeFragment(phone)
    });
  }
  ref14 = gContact.gd$im || [];
  for (l = 0, len2 = ref14.length; l < len2; l++) {
    iM = ref14[l];
    contact.datapoints.push({
      name: "chat",
      value: iM.address,
      type: ((ref15 = iM.protocol) != null ? ref15.split('#')[1] : void 0) || 'other'
    });
  }
  ref16 = gContact.gd$structuredPostalAddress || [];
  for (m = 0, len3 = ref16.length; m < len3; m++) {
    adr = ref16[m];
    contact.datapoints.push({
      name: "adr",
      value: ["", "", ((ref17 = adr.gd$street) != null ? ref17.$t : void 0) || "", ((ref18 = adr.gd$city) != null ? ref18.$t : void 0) || "", ((ref19 = adr.gd$region) != null ? ref19.$t : void 0) || "", ((ref20 = adr.gd$postcode) != null ? ref20.$t : void 0) || "", ((ref21 = adr.gd$country) != null ? ref21.$t : void 0) || ""],
      type: getTypeFragment(adr)
    });
  }
  websites = gContact.gContact$website || [];
  for (n = 0, len4 = websites.length; n < len4; n++) {
    web = websites[n];
    contact.datapoints.push({
      name: "url",
      value: web.href,
      type: getTypePlain(web)
    });
  }
  ref22 = gContact.gContact$relation || [];
  for (o = 0, len5 = ref22.length; o < len5; o++) {
    rel = ref22[o];
    contact.datapoints.push({
      name: "relation",
      value: rel.$t,
      type: getTypePlain(rel)
    });
  }
  ref23 = gContact.gContact$event || [];
  for (p = 0, len6 = ref23.length; p < len6; p++) {
    ev = ref23[p];
    contact.datapoints.push({
      name: "about",
      value: (ref24 = ev.gd$when) != null ? ref24.startTime : void 0,
      type: getTypePlain(ev)
    });
  }
  contact.tags = ['google'];
  return contact;
};

GCH.toGoogleContact = function(contact, gEntry) {
  var _extend, addField, dp, field, firstName, gContact, i, lastName, len, middleName, name, org, prefix, ref, ref1, ref2, ref3, setTypeFragment, street, suffix;
  _extend = function(a, b) {
    var k, v;
    for (k in b) {
      v = b[k];
      if (v != null) {
        a[k] = v;
      }
    }
    return a;
  };
  gContact = {
    updated: {
      $t: contact.revision
    }
  };
  ref = contact.n.split(';'), lastName = ref[0], firstName = ref[1], middleName = ref[2], prefix = ref[3], suffix = ref[4];
  name = {};
  name.gd$fullName = {
    $t: contact.fn
  };
  if ((lastName != null) && lastName !== '') {
    name.gd$familyName = {
      $t: lastName
    };
  }
  if ((firstName != null) && firstName !== '') {
    name.gd$givenName = {
      $t: firstName
    };
  }
  name.gd$additionalName = (middleName != null) && middleName !== '' ? {
    $t: middleName
  } : void 0;
  if ((prefix != null) && prefix !== '') {
    name.gd$namePrefix = {
      $t: prefix
    };
  }
  if ((suffix != null) && suffix !== '') {
    name.gd$nameSuffix = {
      $t: suffix
    };
  }
  gContact.gd$name = name;
  if (contact.bday != null) {
    gContact.gContact$birthday = {
      when: contact.bday
    };
  }
  if (contact.nickname != null) {
    gContact.gContact$nickname = {
      $t: contact.nickname
    };
  }
  gContact.content = {
    $t: contact.note || ''
  };
  if ((contact.org != null) || (contact.title != null)) {
    org = {
      rel: "http://schemas.google.com/g/2005#other"
    };
    if (contact.org != null) {
      org.gd$orgName = {
        $t: contact.org
      };
    }
    if (contact.title != null) {
      org.gd$orgTitle = {
        $t: contact.title
      };
    }
    gContact.gd$organization = [org];
  }
  setTypeFragment = function(dp, field) {
    var ref1;
    if ((ref1 = dp.type) === 'fax' || ref1 === 'home' || ref1 === 'home_fax' || ref1 === 'mobile' || ref1 === 'other' || ref1 === 'pager' || ref1 === 'work' || ref1 === 'work_fax') {
      field.rel = "http://schemas.google.com/g/2005#" + dp.type;
    } else {
      field.label = dp.type;
    }
    return field;
  };
  addField = function(gField, field) {
    if (!gContact[gField]) {
      gContact[gField] = [];
    }
    return gContact[gField].push(field);
  };
  if (contact.url && !contact.datapoints.some(function(dp) {
    return dp.type === "url" && dp.value === contact.url;
  })) {
    addField('gContact$website', {
      href: contact.url,
      rel: 'other'
    });
  }
  ref1 = contact.datapoints;
  for (i = 0, len = ref1.length; i < len; i++) {
    dp = ref1[i];
    if (!((dp.value != null) && dp.value !== '')) {
      continue;
    }
    name = dp.name.toUpperCase();
    switch (name) {
      case 'TEL':
        if ((dp.value != null) && dp.value !== '') {
          addField('gd$phoneNumber', setTypeFragment(dp, {
            $t: dp.value
          }));
        }
        break;
      case 'EMAIL':
        field = setTypeFragment(dp, {
          address: dp.value
        });
        if (field.pref) {
          field.primary = "true";
        }
        addField('gd$email', field);
        break;
      case 'ADR':
        if (dp.value instanceof Array) {
          field = setTypeFragment(dp, {});
          field.gd$formattedAddress = ContactHelper.adrArrayToString(dp.value);
          street = ContactHelper.adrCompleteStreet(dp.value);
          if (street !== '') {
            field.gd$street = {
              $t: street
            };
          }
          if (dp.value[3]) {
            field.gd$city = {
              $t: dp.value[3]
            };
          }
          if (dp.value[4]) {
            field.gd$region = {
              $t: dp.value[4]
            };
          }
          if (dp.value[5]) {
            field.gd$postcode = {
              $t: dp.value[5]
            };
          }
          if (dp.value[6]) {
            field.gd$country = {
              $t: dp.value[6]
            };
          }
          addField("gd$structuredPostalAddress", field);
        }
        break;
      case 'CHAT':
        addField('gd$im', {
          protocol: "http://schemas.google.com/g/2005#" + dp.type,
          address: dp.value,
          rel: "http://schemas.google.com/g/2005#other"
        });
        break;
      case 'SOCIAL':
      case 'URL':
        field = {
          href: dp.value
        };
        if ((ref2 = dp.type) === 'home-page' || ref2 === 'blog' || ref2 === 'profile' || ref2 === 'home' || ref2 === 'work' || ref2 === 'other' || ref2 === 'ftp') {
          field.rel = dp.type;
        } else {
          field.label = dp.type;
        }
        addField('gContact$website', field);
        break;
      case 'ABOUT':
        field = {
          gd$when: {
            startTime: dp.value
          }
        };
        if (dp.type === 'anniversary') {
          field.rel = dp.type;
        } else {
          field.label = dp.type;
        }
        addField('gContact$event', field);
        break;
      case 'RELATION':
        field = {
          $t: dp.value
        };
        if ((ref3 = dp.type) === 'assistant' || ref3 === 'brother' || ref3 === 'child' || ref3 === 'domestic-partner' || ref3 === 'father' || ref3 === 'friend' || ref3 === 'manager' || ref3 === 'mother' || ref3 === 'parent' || ref3 === 'partner' || ref3 === 'referred-by' || ref3 === 'relative' || ref3 === 'sister' || ref3 === 'spouse') {
          field.rel = dp.type;
        } else {
          field.label = dp.type;
        }
        addField('gContact$relation', field);
    }
  }
  if (gEntry != null) {
    return _extend(gEntry, gContact);
  } else {
    return gContact;
  }
};

PICTUREREL = "http://schemas.google.com/contacts/2008/rel#photo";

GCH.addContactPictureInCozy = function(accessToken, cozyContact, gContact, done) {
  var hasPicture, opts, pictureLink, pictureUrl, ref, ref1;
  log.debug("addContactPictureInCozy " + (GCH.extractGoogleId(gContact)));
  pictureLink = gContact.link.filter(function(link) {
    return link.rel === PICTUREREL;
  });
  pictureUrl = (ref = pictureLink[0]) != null ? ref.href : void 0;
  hasPicture = ((ref1 = pictureLink[0]) != null ? ref1['gd$etag'] : void 0) != null;
  if (!(pictureUrl && hasPicture)) {
    return done(null);
  }
  opts = url.parse(pictureUrl);
  opts.headers = {
    'Authorization': 'Bearer ' + accessToken,
    'GData-Version': '3.0'
  };
  log.debug("fetch " + (GCH.extractGoogleId(gContact)) + " contact's picture");
  return request = https.get(opts, function(stream) {
    var buffers, thumbStream;
    log.debug("response for " + (GCH.extractGoogleId(gContact)) + " picture");
    stream.on('error', done);
    if (stream.statusCode !== 200) {
      return done(new Error("error fetching " + pictureUrl + ": " + stream.statusCode));
    }
    buffers = [];
    thumbStream = stream.pipe(im().resize('300x300^').crop('300x300'));
    thumbStream.on('error', done);
    thumbStream.on('data', function(data) {
      return buffers.push(data);
    });
    return thumbStream.on('end', function() {
      var type;
      type = stream.headers['content-type'];
      opts = {
        name: 'picture',
        type: type
      };
      return cozyContact.attachFile(Buffer.concat(buffers), opts, function(err) {
        if (err) {
          log.error("picture " + err);
        } else {
          log.debug("picture ok");
        }
        return done(err);
      });
    });
  });
};

GCH.putPicture2Google = function(accessToken, account, contact, callback) {
  var options, ref, req, stream;
  if (((ref = contact._attachments) != null ? ref.picture : void 0) == null) {
    return callback();
  }
  stream = contact.getFile('picture', function(err) {
    if (err) {
      return callback(err);
    }
  });
  options = {
    method: 'PUT',
    host: 'www.google.com',
    port: 443,
    path: "/m8/feeds/photos/media/" + account.name + "/" + account.id,
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'GData-Version': '3.0',
      'Content-Type': 'image/*',
      'If-Match': '*'
    }
  };
  req = https.request(options, function(res) {
    res.on('error', callback);
    return res.on('data', function(chunk) {
      var msg;
      if (res.statusCode !== 200) {
        msg = res.statusCode + " while uploading picture: ";
        msg += chunk.toString();
        log.info(msg);
      }
      return callback();
    });
  });
  return stream.pipe(req);
};

GCH.filterContactsOfAccountByIds = function(cozyContacts, accountName) {
  var account, contact, i, len, ofAccountByIds;
  ofAccountByIds = {};
  for (i = 0, len = cozyContacts.length; i < len; i++) {
    contact = cozyContacts[i];
    account = contact.getAccount(GCH.ACCOUNT_TYPE, accountName);
    if (account != null) {
      ofAccountByIds[account.id] = contact;
    }
  }
  return ofAccountByIds;
};

GCH.fetchAccountName = function(accessToken, callback) {
  var client;
  client = request.createClient('https://www.googleapis.com');
  client.headers = {
    'Authorization': 'Bearer ' + accessToken,
    'GData-Version': '3.0'
  };
  return client.get('/oauth2/v2/userinfo', function(err, res, body) {
    if (err) {
      return callback(err);
    }
    if (body.error) {
      log.info("Error while fetching account name : ");
      log.info(body);
      return callback(body);
    }
    return callback(null, body.email);
  });
};

GCH.updateCozyContact = function(gEntry, contacts, accountName, token, callback) {
  var Contact, accountC, accountG, cozyContact, cozyContacts, endSavePicture, fromCozy, fromGoogle, gId, i, len, ofAccountByIds, updateContact;
  Contact = require('../models/contact');
  ofAccountByIds = contacts.ofAccountByIds;
  cozyContacts = contacts.cozyContacts;
  fromGoogle = new Contact(GCH.fromGoogleContact(gEntry, accountName));
  gId = GCH.extractGoogleId(gEntry);
  endSavePicture = function(err, updatedContact) {
    if (err != null) {
      log.error("An error occured while creating or updating the " + "contact.");
      log.raw(err);
      return callback(err);
    }
    log.debug("updated " + (fromGoogle != null ? fromGoogle.fn : void 0));
    return GCH.addContactPictureInCozy(token, updatedContact, gEntry, callback);
  };
  updateContact = function(fromCozy, fromGoogle) {
    CompareContacts.mergeContacts(fromCozy, fromGoogle);
    return fromCozy.save(endSavePicture);
  };
  accountG = fromGoogle.accounts[0];
  if (accountG.id in ofAccountByIds) {
    fromCozy = ofAccountByIds[accountG.id];
    accountC = fromCozy.getAccount(GCH.ACCOUNT_TYPE, accountName);
    if (accountC.lastUpdate < accountG.lastUpdate && ContactHelper.intrinsicRev(fromGoogle) !== ContactHelper.intrinsicRev(fromCozy)) {
      log.info("Update " + gId + " from google");
      log.debug("Update " + (fromCozy != null ? fromCozy.fn : void 0) + " from google");
      return updateContact(fromCozy, fromGoogle);
    } else {
      log.info("Google contact " + gId + " already synced and uptodate");
      log.debug("GContact " + (fromCozy != null ? fromCozy.fn : void 0) + " already synced and uptodate");
      return callback();
    }
  } else {
    fromCozy = null;
    for (i = 0, len = cozyContacts.length; i < len; i++) {
      cozyContact = cozyContacts[i];
      if (CompareContacts.isSamePerson(cozyContact, fromGoogle)) {
        fromCozy = cozyContact;
        log.debug((fromCozy != null ? fromCozy.fn : void 0) + " is same person");
        break;
      }
    }
    if ((fromCozy != null) && (fromCozy.getAccount(GCH.ACCOUNT_TYPE, accountName) == null)) {
      log.info("Link " + gId + " to google account");
      log.debug("Link " + (fromCozy != null ? fromCozy.fn : void 0) + " to google account");
      return updateContact(fromCozy, fromGoogle);
    } else {
      log.info("Create " + gId + " contact");
      log.debug("Create " + (fromGoogle != null ? fromGoogle.fn : void 0) + " contact");
      fromGoogle.revision = new Date().toISOString();
      return Contact.create(fromGoogle, endSavePicture);
    }
  }
};
