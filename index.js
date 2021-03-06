const got = require("got");
const cheerio = require('cheerio');
const url = require('url');
const tunnel = require('tunnel');
let getProxy = function(proxy) {
	return proxy ? { agent: {
			https: tunnel.httpsOverHttp({
				proxy: {
					host: proxy.split(':')[0],
					port: proxy.split(':')[1]
				}
			})
		}} : {}
}
exports.generateEmail = (cb, proxy = null) =>{
	got("https://www.gmailnator.com/", {
		headers: {
			"Host": "www.gmailnator.com",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			"Connection": "keep-alive",
			"DNT": "1",
			"Connection": "keep-alive",
			"Upgrade-Insecure-Requests": "1"
		},
		...getProxy(proxy)
	}).then(function(response) {
		var $ = cheerio.load(response.body);
		var csrf = $("#csrf-token")[0].attribs.content;
		var bodyD = "csrf_gmailnator_token=" + csrf + "&action=GenerateEmail&data%5B%5D=2&data%5B%5D=3";
		var l1 = encodeURIComponent(bodyD).match(/%[89ABab]/g);
		var l = bodyD.length + (l1 ? l1.length : 0)
		got.post("https://www.gmailnator.com/index/indexquery", {
			body: bodyD,
			...getProxy(proxy),
			headers: {
				"Host": "www.gmailnator.com",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				"Connection": "keep-alive",
				"Upgrade-Insecure-Requests": "1",
				"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				"X-Requested-With": "XMLHttpRequest",
				"Content-Length": l,
				"Origin": "https://www.gmailnator.com/",
				"DNT": "1",
				"Connection": "keep-alive",
				"Referer": "https://www.gmailnator.com",
				"Cookie": "csrf_gmailnator_cookie=" + csrf,
				"TE": "Trailers"
			}
		}).then(function(response) {
			cb(null, response.body)
		}).catch(function(e) {
			cb(e, null)
		})
	}).catch(function(e) {
		cb(e, null)
	})
}

exports.checkEmails = (email, cb, proxy = null) => {
	if (!email) {
		console.error("Needs email param");
		return false;
	}
	var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (!regex.test(email)) {
		console.error("Not valid email");
		return false;
	}
	var iburl = "https://www.gmailnator.com/inbox/#" + email
	got(iburl, {
		...getProxy(proxy),
		headers: {
			"Host": "www.gmailnator.com",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			"Connection": "keep-alive",
			"Upgrade-Insecure-Requests": "1"
		}
	}).then(function(response) {
		var $ = cheerio.load(response.body);
		var csrf = $("#csrf-token")[0].attribs.content;
		var data = "csrf_gmailnator_token=" + csrf + "&action=LoadMailList&Email_address=" + encodeURIComponent(email);
		var l1 = encodeURIComponent(data).match(/%[89ABab]/g);
		var l = data.length + (l1 ? l1.length : 0)
		let ci_session_cookie = response.headers['set-cookie'][2].split(';')[0];
		let cfd_uid_cookie = response.headers['set-cookie'][0].split(';')[0];
		got.post("https://www.gmailnator.com/mailbox/mailboxquery", {
			body: data,

			...getProxy(proxy),
			headers: {
				"Host": "www.gmailnator.com",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
				"Accept": "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
				"X-Requested-With": "XMLHttpRequest",
				"Content-Length": l,
				"Origin": "https://gmailnator.com",
				"Connection": "keep-alive",
				"Referer": "https://gmailnator.com/inbox",
				"Cookie": "csrf_gmailnator_cookie=" + csrf + "; " + ci_session_cookie + '; ' + cfd_uid_cookie,
				"TE": "Trailers",
				"Pragma": "no-cache",
				"Cache-Control": "no-cache"
			}
		}).then(function(response){
			var d = JSON.parse(response.body);
			var b = [];
			for (var c in d) {
				var $ = cheerio.load(d[c].content);
				var lin = $("a")[0].attribs.href;
				var sub = $("tbody td")[0].children[0].data;
				if ($("tbody td")[2].children[0].data !== undefined) {
					var des = $("tbody td")[1].children[0].data;
					var tim = $("tbody td")[2].children[0].data;
					var data = {
						"subject": sub,
						"description": des,
						"lastSent": tim,
						"link": lin
					}
					b.push(data);
				} else {
					var des = "";
					var tim = $("tbody td")[1].children[0].data;
					var data = {
						"subject": sub,
						"description": des,
						"lastSent": tim,
						"link": lin
					}
					b.push(data)
				}

			}
			var body = JSON.parse(JSON.stringify({
				"emails": b,
				"csrf": csrf,
				cfd_uid_cookie,
				ci_session_cookie
			}));
			cb(null,body);
		}).catch(function(e) {
			cb(e, null)
		})
	}).catch(function(e) {
		cb(e, null)
	})
}

exports.getMessage = (str, csrf, ci_session_cookie, cfd_uid_cookie, cb, proxy = null) => {
	if (!str | !csrf) {
		cb("Needs email or csrf_token param", null);
		return false;
	}
	var s = url.parse(str, true);
	var email = s.pathname.split("/")[1];
	var id = s.hash.substring(1, s.hash.length);
	var data = "csrf_gmailnator_token=" + csrf +"&action=get_message&message_id=" + id + "&email=" + email;
	var l1 = encodeURIComponent(data).match(/%[89ABab]/g);
	var l = data.length + (l1 ? l1.length : 0)
	got.post("https://gmailnator.com/mailbox/get_single_message/", {
		body: data,
		...getProxy(proxy),
		headers: {
			"Host": "www.gmailnator.com",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
			"Accept": "application/json, text/javascript, */*; q=0.01",
			"Accept-Language": "en-US,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"X-Requested-With": "XMLHttpRequest",
			"Content-Length": l,
			"Origin": "https://gmailnator.com",
			"Connection": "keep-alive",
			"Referer": "https://gmailnator.com/inbox",
			"Cookie": "csrf_gmailnator_cookie=" + csrf + "; " + ci_session_cookie + '; ' + cfd_uid_cookie,
			"TE": "Trailers",
			"Pragma": "no-cache",
			"Cache-Control": "no-cache"
		}
	}).then(function(response) {
		cb(null, JSON.parse(response.body));
	}).catch(function(e) {
		cb(e, null)
	})
}
