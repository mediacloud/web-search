// Firefox Proxy Settings (as of Linux Firefox 129.0.2):
// *E*dit > Setti*n*gs -> Network Settings (at bottom) S*e*ttings... button
//      + Select radio button _A_utomatic proxy configuration file
//      + Enter "file:///ABS/PATH/proxy.pac" (with real path, without quotes)
//      + check box Proxy _D_NS when using SOCKS v5
//      If you edit this file once loaded, reopen the screen and
//      click R*e*load.
//
// Linux Chrome uses system proxy settings?
//	running chrome --proxy-pac-url=file:///ABS/PATH/proxy.pac
//	might work??
//      visiting chrome://net-internals/#proxy
//	may allow reload??

// Mac browsers may honor System Preferences > Network
//      click on Advanced... (bottom right)
//      click on Proxies tab on top
//      check "Automatic Proxy Configuration"
//      fill in Proxy Configuration File URL:
//	with file:///ABS/PATH/proxy.pac

// You need to have an ssh connection started with:
// ssh -D9999 angwin.fq.dn
// so your local ssh will listen on port 9999 as a SOCKS5 proxy,
// passing connection requests with hostnames ending in .angwin
// (resolved remotely on angwin).

// You can only open one such window!

// You can use any port number (above 1023), but you'll
//  need to replace all 9999's below with your favorite port.
//
// You can also define an host in your .ssh/config file:
//
// host angwin9999
//   User YOUR_USERNAME
//   Hostname angwin.fq.dn
//   DynamicForward 9999

// Don't use with Safari - it apparently does not like alerts at all!
// *AND* some browser versions won't parse `${var}` so avoiding that!
var dbg = 0;

// PLB  2020-08-21: to debug with Firefox:
//      set dbg = 1 (or 2) above
//      reload .pac file (see above)
//      Tools -> Web Developer -> Browser Console (Ctrl+Shift+J) [*NOT* Web Console!!] -> Filter output: PAC
//      You can also watch your browser making connections!
//      (Browser console will also show syntax errors in this file
//       without enabling dbg)

function FindProxyForURL(url, host) {
    if (dbg > 1) alert("here url: " + url + " host: " + host);
    if (host.toLowerCase().endsWith(".angwin")) {
        if (dbg) alert("PROXY " + host);
        // my recall is that different browsers honor SOCKS5 vs SOCKS:
        return "SOCKS5 127.0.0.1:9999;SOCKS 127.0.0.1:9999; DIRECT";
    } else {
        if (dbg) alert("DIRECT " + host);
        return "DIRECT";
    }
}
