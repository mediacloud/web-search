import unittest
import datetime as dt
import dateparser

from server.platforms.onlinenews import OnlineNewsMediaCloudProvider, OnlineNewsWaybackMachineProvider
from server import MEDIA_CLOUD_API_KEY


class OnlineNewsMediaCloudProviderTest(unittest.TestCase):

    def setUp(self):
        self._provider = OnlineNewsMediaCloudProvider(MEDIA_CLOUD_API_KEY)

    def test_count(self):
        results = self._provider.count("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                        dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        assert results > 0

    def test_sample(self):
        results = self._provider.sample("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                        dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        for post in results:
            assert 'url' in post

    def test_item(self):
        stories_id = 123123
        story = self._provider.item(stories_id)
        assert story['media_id'] == 15
        assert story['stories_id'] == stories_id
        assert len(story['title']) > 0

    def test_count_over_time(self):
        results = self._provider.count_over_time("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                                 dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        for item in results['counts']:
            assert 'date' in item
            assert 'count' in item

    def test_normalized_count_over_time(self):
        results = self._provider.normalized_count_over_time("Trump",
                                                            dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                                            dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        assert 'counts' in results
        assert 'total' in results
        assert results['total'] > 0
        assert 'normalized_total' in results


class OnlineNewsWaybackMachineProviderTest(unittest.TestCase):

    def setUp(self):
        self._provider = OnlineNewsWaybackMachineProvider()

    def test_count(self):
        results = self._provider.count("coronavirus", dt.datetime(2019, 1, 1), dt.datetime(2019, 2, 1))
        assert results > 0

    def test_no_results(self):
        results = self._provider.count("coronavirus", dt.datetime(2000, 1, 1), dt.datetime(2000, 1, 1))
        assert results > 0

    def test_count_over_time(self):
        results = self._provider.count_over_time("coronavirus", dt.datetime(2019, 1, 1), dt.datetime(2019, 2, 1))
        assert len(results) > 0
        for item in results['counts']:
            assert 'date' in item
            assert 'count' in item
            assert item['count'] > 0

    def test_domain_clause(self):
        domain = "cnn.com"
        results = self._provider.sample("coronavirus and domain:({})".format(domain),
                                        dt.datetime(2019, 1, 1), dt.datetime(2022, 7, 1))
        assert len(results) > 0
        for s in results:
            assert s['media_name'] == domain

    def test_many_domains_clause(self):
        # us regional (1000 limit) as of 2022 July
        domains = ['usatoday.com', 'latimes.com', 'nypost.com', 'nydailynews.com', 'chicagotribune.com', 'chron.com', 'dallasnews.com', 'newsday.com', 'sfgate.com', 'nj.com', 'ajc.com', 'startribune.com', 'tampabay.com', 'ocregister.com', 'sacbee.com', 'stltoday.com', 'miamiherald.com', 'kansascity.com', 'denverpost.com', 'mysanantonio.com', 'baltimoresun.com', 'mercurynews.com', 'jsonline.com', 'orlandosentinel.com', 'sun-sentinel.com', 'dispatch.com', 'newsok.com', 'post-gazette.com', 'bostonherald.com', 'twincities.com', 'omaha.com', 'arkansasonline.com', 'buffalonews.com', 'newsobserver.com', 'courant.com', 'palmbeachpost.com', 'statesman.com', 'pe.com', 'lvrj.com', 'northjersey.com', 'contracostatimes.com', 'fresnobee.com', 'jacksonville.com', 'commercialappeal.com', 'dailynews.com', 'sltrib.com', 'toledoblade.com', 'ohio.com', 'daytondailynews.com', 'tulsaworld.com', 'knoxnews.com', 'thenewstribune.com', 'heraldtribune.com', 'kentucky.com', 'mcall.com', 'thestate.com', 'abqjournal.com', 'washingtontimes.com', 'eastvalleytribune.com', 'dailyherald.com', 'dcist.com', 'laobserved.com', 'sfist.com', 'blueoregon.com', 'politickernj.com', 'nymag.com', 'chicagomag.com', 'mspmag.com', 'alvaradostar.net', 'commercejournal.com', 'commercialrecorder.com', 'dailycommercialrecord.com', 'dentonrc.com', 'elliscountypress.com', 'farmersvilletimes.com', 'focusdailynews.com', 'jcrecordcourier.com', 'heraldbanner.com', 'kaufmanherald.com', 'themonitor.net', 'peoplenewspapers.com', 'postsignal.com', 'terrelltribune.com', 'weatherforddemocrat.com', 'wcmessenger.com', 'wylienews.com', 'nbcdfw.com', 'wfaa.com', 'wbap.com', 'callnewspapers.com', 'news-daily.com', 'newstribune.com', 'theodessan.net', 'stlamerican.com', 'bizjournals.com', 'thedailyrecord.com', 'riverfronttimes.com', 'troyfreepress.com', 'kmov.com', 'ksdk.com', '971talk.com', 'chagrinvalleytimes.com', 'clevelandjewishnews.com', 'csuohio.edu', 'mapleheightspress.com', 'cwruobserver.com', 'wkyc.com', 'wtam.com', 'biscaynetimes.com', 'bocanews.com', 'cggazette.com', 'miaminewtimes.com', 'miamitodaynews.com', 'palmbeachdailynews.com', 'southdadenewsleader.com', 'communitynewspapers.com', 'bizjournals.com', 'wsvn.com', 'cbs12.com', 'wflx.com', '610wiod.com', 'canbyherald.com', 'wweek.com', 'katu.com', 'koinlocal6.com', 'kgw.com', 'opb.org', 'kunptv.com', '1190kex.com', 'examiner-enterprise.com', 'neighbornews.com', 'claremoreprogress.com', 'pawhuskajournalcapital.com', 'sapulpaheraldonline.com', 'urbantulsa.com', 'newson6.com', 'tulsabeacon.com', 'krmg.com', '1170kfaq.com', 'michiganradio.org', 'michigandaily.com', 'wlos.com', 'smokymountainnews.com', 'blueridgenow.com', 'lavozindependiente.com', 'wwnc.com', 'mountainx.com', 'centralillinoisproud.com', 'pjstar.com', 'wtvr.com', 'wric.com', 'chesterfieldobserver.com', 'henricocitizen.com', 'nbc12.com', 'fox23.com', 'ktul.com', 'wmdt.com', 'wday.com', 'enderlinindependent.com', 'nwpr.org', 'thenorthernlight.com', 'ccreporter.com', 'c-ville.com', 'readthehook.com', 'whatcomwatch.org', 'wboc.com', 'bellinghamherald.com', 'lyndentribune.com', 'cascadiaweekly.com', 'kfgo.com', 'doverpost.com', 'cavalierdaily.com', 'nbc29.com', 'dailyprogress.com', 'wina.com', 'wdov.com', 'kgmi.com', 'hpr1.com', 'wsau.com', 'centralwinews.com', 'marshfieldnewsherald.com', 'waow.com', 'wpt.org', 'thecitypages.com', 'wausaudailyherald.com', 'wsaw.com', 'dln.com', 'westlifenews.com', 'cleveland.com', 'community-news.com', 'cleburnetimesreview.com', 'fwweekly.com', 'star-telegram.com', 'itemonline.com', 'murphymonitor.com', 'princetonherald.com', 'parkcitiesnews.com', 'sachsenews.com', 'tjpnews.com', 'rockwallcountynews.com', 'salinereporter.com', 'toysh.livejournal.com', 'gigaom.com', 'eriepa.com', 'reviewtimes.com', 'theregister.co.uk', 'gothamist.com', 'nola.com', 'bhamterminal.com', 'sunnewsonline.com', 'desmoinesregister.com', 'thegazette.com', 'qctimes.com', 'wcfcourier.com', 'siouxcityjournal.com', 'press-citizen.com', 'amestrib.com', 'stormlake.com', 'globegazette.com', 'osceolaiowa.com', 'chronicletimes.com', 'dickinsoncountynews.com', 'spencerdailyreporter.com', 'algona.com', 'thehill.com', 'boston.com', 'wnep.com', 'pennlive.com', 'cbslocal.com', 'mercurynews.com', 'cjonline.com', 'mit.edu', 'ctmirror.org', 'scpr.org', 'austinchronicle.com', 'postandcourier.com', 'wbez.org', 'king5.com', 'washingtonexaminer.com', 'oaoa.com', 'myfoxny.com', 'dailycamera.com', 'robdailynews.com', 'washingtonian.com', 'paloaltoonline.com', 'newschannel6now.com', 'daily-times.com', 'hawaiireporter.com', 'nj.com', 'kswo.com', '850koa.com', 'newarkpostonline.com', 'qconline.com', 'freep.com', 'deseretnews.com', 'wcyb.com', 'bangordailynews.com', 'lasvegassun.com', 'delawareonline.com', 'wdel.com', 'politicspa.com', 'indybay.org', 'texastribune.org', 'washingtonblade.com', 'wgmd.com', 'seattleweekly.com', 'nbcmontana.com', 'timesunion.com', '13wmaz.com', 'newjerseynewsroom.com', 'milforddailynews.com', 'njspotlight.com', 'heraldextra.com', 'timesrecordnews.com', 'cbslocal.com', 'therepublic.com', 'watertowndailytimes.com', 'qsaltlake.com', 'kansan.com', 'courierpostonline.com', 'wickedlocal.com', 'longislandpress.com', 'prairieadvocate.com', 'villagevoice.com', 'kcci.com', 'uticaod.com', 'myfoxdc.com', 'wayneindependent.com', 'lohud.com', 'journalstar.com', 'cronkitenewsonline.com', 'ktna.org', 'roanoke.com', 'suntimes.com', 'metroweekly.com', 'kvue.com', 'publicradio.org', '630wpro.com', 'sacramentopress.com', 'abc57.com', 'wfirnews.com', 'fox13now.com', 'prescottenews.com', 'augusta.com', 'federalnewsradio.com', 'nhpr.org', 'localnews8.com', 'bendbulletin.com', 'wdtv.com', 'ny1.com', 'jewishjournal.com', 'kuow.org', 'washingtoncitypaper.com', 'abcactionnews.com', 'wpri.com', 'pbn.com', 'theepochtimes.com', 'providencephoenix.com', 'lowellsun.com', 'bestofneworleans.com', 'newstimes.com', 'wftv.com', 'heraldonline.com', 'myfoxchicago.com', 'myfoxorlando.com', 'clickorlando.com', 'kpho.com', 'masslive.com', 'uppermichiganssource.com', 'kctv5.com', 'abc-7.com', 'cityandstateny.com', '10news.com', 'vnews.com', 'al.com', 'wtoc.com', 'wsbtv.com', 'amsterdamnews.com', 'theindychannel.com', 'silive.com', 'charlotteobserver.com', 'kusi.com', 'sunshinestatenews.com', 'cbs8.com', 'clarksvilleonline.com', '11alive.com', 'wesh.com', 'mysanfordherald.com', 'nbcmiami.com', 'minnpost.com', 'thedaonline.com', 'nbcsandiego.com', 'fox8.com', 'wdbo.com', 'seattletimes.com', 'wxxinews.org', 'wsav.com', 'elpasotimes.com', 'actionnewsjax.com', 'tallahassee.com', 'rochesterhomepage.net', 'postcrescent.com', 'floridatoday.com', 'nbc-2.com', 'nbcnewyork.com', 'texasinsider.org', 'adn.com', 'citypages.com', '760kfmb.com', 'kvoa.com', 'azcentral.com', 'wishtv.com', 'wmfe.org', 'wjla.com', 'standard.net', 'kmtv.com', 'theithacajournal.com', 'myfoxtampabay.com', 'arkansasmatters.com', 'cbslocal.com', 'vindy.com', 'abc2news.com', 'orlandoweekly.com', 'wsoctv.com', 'wral.com', 'amny.com', 'dailytexanonline.com', 'kfdm.com', 'brooklynpaper.com', 'kplr11.com', 'wsbt.com', 'q13fox.com', 'wmctv.com', 'kspr.com', 'salem-news.com', 'dailycommercial.com', 'independentmail.com', 'ecollegetimes.com', 'ktar.com', 'themonitor.com', 'columbiaspectator.com', 'radioiowa.com', 'stardem.com', 'wdsu.com', 'timesfreepress.com', 'stamfordadvocate.com', 'foxcarolina.com', 'cbslocal.com', 'greenbaypressgazette.com', 'firstcoastnews.com', 'thebostonpilot.com', 'dailyamerican.com', 'local15tv.com', 'wptv.com', '12newsnow.com', 'berkeleydailyplanet.com', 'wtsp.com', 'wtop.com', 'courierpress.com', 'abc15.com', 'myrtlebeachonline.com', 'nbcbayarea.com', 'kmbc.com', 'komonews.com', 'walb.com', 'wwltv.com', 'wavenewspapers.com', 'wbbjtv.com', 'ktvb.com', 'queenstribune.com', 'crainsnewyork.com', 'khou.com', 'azfamily.com', 'portclintonnewsherald.com', 'kshb.com', 'centralmaine.com', 'enewspf.com', 'ktre.com', 'lancasteronline.com', 'detroitnews.com', 'kktv.com', 'winonadailynews.com', 'whiotv.com', 'philadelphiaweekly.com', 'myfoxdetroit.com', 'news10.net', 'nevadaappeal.com', 'baynews9.com', 'bdtonline.com', 'gainesville.com', 'thesuburbanite.com', 'cbslocal.com', 'nbc26.com', 'weartv.com', 'kfoxtv.com', 'tricities.com', 'thenorthwestern.com', 'witn.com', 'clickondetroit.com', 'wspa.com', 'gjsentinel.com', 'nbcwashington.com', 'thejewishstar.com', 'azdailysun.com', 'wbir.com', 'mainlinemedianews.com', 'chicagobusiness.com', 'gazettenet.com', 'blackstarnews.com', 'news9.com', 'capecodonline.com', 'wlox.com', 'islandpacket.com', 'nbcphiladelphia.com', 'lpb.org', 'sfbayview.com', 'fox10tv.com', 'bradenton.com', 'triblive.com', 'wtae.com', 'wndu.com', 'seminolechronicle.com', 'loudountimes.com', 'wctv.tv', 'timesleader.com', 'local10.com', 'news-press.com', 'uvaldeleadernews.com', 'rutlandherald.com', 'midlandsconnect.com', 'usf.edu', 'cdispatch.com', 'riverdalepress.com', 'themonticellonews.com', 'kdvr.com', 'chicagoist.com', 'chicagoreporter.com', '14news.com', 'wistv.com', 'cbslocal.com', 'wxow.com', 'fox40.com', 'democratandchronicle.com', 'news-leader.com', 'ktvu.com', 'poconorecord.com', 'cincinnati.com', 'kgab.com', 'scnow.com', 'thecrimson.com', 'whec.com', 'wyff4.com', 'chicagotribune.com', 'sandiego.com', 'ocala.com', 'beaumontenterprise.com', 'ky3.com', 'wusa9.com', 'dailynewstranscript.com', 'capitolfax.com', 'heraldnet.com', 'goupstate.com', 'dailypress.com', 'nbclosangeles.com', 'wmal.com', 'austindailyherald.com', 'cbslocal.com', 'iberkshires.com', 'spokesman.com', 'reviewjournal.com', 'bnd.com', 'pnwlocalnews.com', 'fridayflyer.com', 'fox45now.com', 'katc.com', 'eldiariony.com', 'wdtn.com', 'wsbradio.com', 'investors.com', 'cbslocal.com', 'rnntv.com', 'hawaiinewsnow.com', 'coshoctontribune.com', 'heralddemocrat.com', 'gcdailyworld.com', 'infozine.com', 'myfoxmemphis.com', 'columbiatribune.com', 'modbee.com', 'news4jax.com', 'weei.com', 'wbaltv.com', 'valdostadailytimes.com', 'phoenixnewtimes.com', 'newstalkradiowhio.com', 'southbendtribune.com', 'independent.com', 'laprensa-sandiego.org', 'missionlocal.org', 'rtumble.com', 'totalcapitol.com', 'westsideobserver.com', 'altadenablog.com', 'calbuzz.com', 'californiascapitol.com', 'capitolweekly.net', 'flashreport.org', 'fogcityjournal.com', 'kpfa.org', 'laist.com', 'noozhawk.com', 'sanfranciscosentinel.com', 'alamedasun.com', 'thealpinesun.com', 'modocrecord.com', 'napavalleyregister.com', 'timespressrecorder.com', 'atascaderonews.com', 'auburnjournal.com', 'placersentinel.com', 'bakersfield.com', 'recordgazette.net', 'desertdispatch.com', 'eastbayexpress.com', 'bhweekly.com', 'canyon-news.com', 'bigbeargrizzly.net', 'inyoregister.com', 'paloverdevalleytimes.com', 'burbankleader.com', 'theimnews.com', 'napavalleyregister.com', 'sierracountyprospect.org', 'thecamarilloacorn.com', 'carmichaeltimes.com', 'coastalview.com', 'cerescourier.com', 'chicoer.com', 'championnewspapers.com', 'americanrivermessenger.com', 'citrusheightsmessenger.com', 'claremont-courier.com', 'coronadonewsca.com', 'dailypilot.com', 'ocweekly.com', 'triplicate.com', 'culvercityobserver.com', 'davisenterprise.com', 'delmartimes.net', 'independentvoice.com', 'ivpressonline.com', 'edhtelegraph.com', 'egcitizen.com', 'thecoastnews.com', 'escalontimes.com', 'times-standard.com', 'thesungazette.com', 'dailyrepublic.com', 'thevillagenews.com', 'fillmoregazette.com', 'folsomtelegraph.com', 'fontanaheraldnews.com', 'advocate-news.com', 'humboldtbeacon.com', 'mountainenterprise.com', 'insidebayarea.com', 'galtheraldonline.com', 'redwoodtimes.com', 'gilroydispatch.com', 'glendalenewspress.com', 'gonzalestribune.com', 'theunion.com', 'greenfieldnews.com', 'gridleyherald.com', 'hmbreview.com', 'hanfordsentinel.com', 'thevalleychronicle.com', 'hesperiastar.com', 'hbnews.us', 'hbindependent.com', 'imperialbeachnewsca.com', 'ledger-dispatch.com', 'kingcityrustler.com', 'kingsburgrecorder.com', 'lacanadaonline.com', 'lajollavillagenews.com', 'coastlinepilot.com', 'lagunabeachindy.com', 'lakeconews.com', 'record-bee.com', 'lincolnnewsmessenger.com', 'independentnews.com', 'lodinews.com', 'lompocrecord.com', 'gazettes.com', 'lbbusinessjournal.com', 'presstelegram.com', 'theloomisnews.com', 'jewishobserver-la.com', 'laweekly.com', 'ladowntownnews.com', 'laopinion.com', 'losbanosenterprise.com', 'maderatribune.com', 'malibutimes.com', 'mammothtimes.com', 'mantecabulletin.com', 'mariposagazette.com', 'appeal-democrat.com', 'mckinleyvillepress.com', 'mendocinobeacon.com', 'almanacnews.com', 'pacificsun.com', 'montecitojournal.net', 'montereyherald.com', 'montereycountyweekly.com', 'lamorindaweekly.com', 'morganhilltimes.com', 'mtshastanews.com', 'mv-voice.com', 'napavalleyregister.com', 'westsideconnect.com', 'ocbj.com', 'theadobepress.com', 'marinij.com', 'oakdaleleader.com', 'sierrastar.com', 'ojaivalleynews.com', 'dailybulletin.com', 'reedleyexponent.com', 'orangevalesun.com', 'orland-press-register.com', 'orovillemr.com', 'desertstarweekly.com', 'avpress.com', 'mercurynews.com', 'pvnews.com', 'paradisepost.com', 'pasadenastarnews.com', 'pasadenaweekly.com', 'pasoroblespress.com', 'mtprogress.net', 'mtdemocrat.com', 'contracostatimes.com', 'ptreyeslight.com', 'recorderonline.com', 'plumasnews.com', 'pomeradonews.com', 'ramonajournal.com', 'ramonasentinel.com', 'iebizjournal.com', 'redbluffdailynews.com', 'redding.com', 'redlandsdailyfacts.com', 'ridgecrestca.com', 'riponrecordnews.com', 'countyrecordnews.com', 'placerherald.com', 'cronicasnewspaper.com', 'bizjournals.com', 'napavalleyregister.com', 'calaverasenterprise.com', 'sbsun.com', 'sddt.com', 'bizjournals.com', 'el-observador.com', 'sfexaminer.com', 'sfweekly.com', 'bizjournals.com', 'thecapistranodispatch.com', 'sanluisobispo.com', 'smdailyjournal.com', 'pacbiztimes.com', 'santacruzsentinel.com', 'santamariasun.com', 'santamariatimes.com', 'smdp.com', 'smmirror.com', 'smobserver.com', 'santapaulatimes.com', 'sonomawest.com', 'selmaenterprise.com', 'soledadbee.com', 'syvnews.com', 'sonomanews.com', 'uniondemocrat.com', 'tahoedailytribune.com', 'recordnet.com', 'lassennews.com', 'goldcountrytimes.com', 'taftmidwaydriller.com', 'tehachapinews.com', 'thearknewspaper.com', 'dailybreeze.com', 'sierrasun.com', 'thefoothillspaper.com', 'visaliatimesdelta.com', 'turlockjournal.com', 'ukiahdailyjournal.com', 'thereporter.com', 'timesheraldonline.com', 'valleycenter.com', 'vcreporter.com', 'vvdailypress.com', 'register-pajaronian.com', 'trinityjournal.com', 'sgvtribune.com', 'whittierdailynews.com', 'willitsnews.com', 'appeal-democrat.com', 'wintersexpress.com', 'dailydemocrat.com', 'sfvbj.com', 'siskiyoudaily.com', 'newsmirror.net', 'hidesertstar.com', 'sandiegomagazine.com', 'thesunrunner.com', 'therip.com', 'thepolypost.com', 'theorion.com', 'csun.edu', 'statehornet.com', 'talonmarks.com', 'cypresscollege.edu', 'lavozdeanza.com', 'elvaq.com', 'lbccviking.com', 'laloyolan.com', 'thecampanil.com', 'theargonaut.net', 'coastreportonline.com', 'pomona.edu', 'theusdvista.com', 'thedailyaztec.com', 'dailycal.org', 'theaggie.org', 'dailybruin.com', 'highlandernews.org', 'ucsdguardian.org', 'ucsf.edu', 'dailytrojan.com', 'bizjournals.com', 'spotlightnews.com', 'amherstbee.com', 'amityvillerecord.com', 'recordernews.com', 'artvoice.com', 'babylonbeacon.com', 'steubencourier.com', 'queenscourier.com', 'bizjournals.com', 'rbj.net', 'canarsiecourier.com', 'thechiefleader.com', 'coopercrier.com', 'the-leader.com', 'oneidadispatch.com', 'dailyfreeman.com', 'dailygazette.com', 'thedailystar.com', 'observertoday.com', '27east.com', 'easthamptonstar.com', 'stargazette.com', 'herkimertelegram.com', 'fltimes.com', 'gcnews.com', 'eveningtribune.com', 'kentonbee.com', 'rochesterlavoz.com', 'lancasterbee.com', 'leaderherald.com', 'leroyny.com', 'massapequapost.com', 'uticaod.com', 'midhudsonnews.com', 'newyorkbeacon.com', 'nypress.com', 'thevillager.com', 'niagarafallsreporter.com', 'niagara-gazette.com', 'nyackvillager.com', 'orchardparkbee.com', 'oswegocountytoday.com', 'pelhamweekly.com', 'poughkeepsiejournal.com', 'pressconnects.com', 'pressrepublican.com', 'westmorenews.com', 'pcnr.com', 'qgazette.com', 'troyrecord.com', 'riverreporter.com', 'timesreview.com', 'romeobserver.com', 'romesentinel.com', 'westmorenews.com', 'saratogatodayonline.com', 'saratogian.com', 'shawangunkjournal.com', 'theneighbornewspapers.com', 'timesreview.com', 'northshoreoflongisland.com', 'oleantimesherald.com', 'qns.com', 'rockawave.com', 'wellsvilledaily.com', 'westsenecabee.com', 'eaglebulletin.com', 'eagle-observer.com', 'skaneatelespress.com', 'theeaglecny.com', 'mpnnow.com', 'palltimes.com', 'thesunnews.net', 'springvillejournal.com', 'portwashington-news.com', 'glencoverecordpilot.com', 'oysterbayenterprisepilot.com', 'farmingdale-observer.com', 'floralparkdispatch.com', 'greatneckrecord.com', 'hicksvillenews.com', 'levittown-tribune.com', 'manhasset-press.com', 'massapequaobserver.com', 'antonnews.com', 'newhydeparkillustrated.com', 'plainviewoldbethpageherald.com', 'theroslynnews.com', 'syossetjerichotribune.com', 'indyeastend.com', 'clarencebee.com', 'cheektowagabee.com', 'eastaurorabee.com', 'gothamgazette.com', 'empirepage.com', 'brooklynrail.org', 'empirestatenews.net', 'auburnpub.com', 'nysun.com', 'rochestercitynewspaper.com', 'cbslocal.com', 'gtweekly.com', 'capradio.org', 'lamag.com', 'kqed.org', 'kpbs.org', 'turnto23.com', 'vcstar.com', 'kcet.org', 'pressdemocrat.com', 'kstp.com', 'montgomeryadvertiser.com', 'annistonstar.com', 'dailynexus.com', 'richmondconfidential.org', 'blackvoicenews.com', 'voiceofsandiego.org', 'newuniversity.org', 'sanjoseinside.com', 'randomlengthsnews.com', 'centralvalleybusinesstimes.com', 'ksby.com', 'thecorsaironline.com', 'jweekly.com', 'thecalifornian.com', 'dailytitan.com', 'mercedsunstar.com', 'solanotempest.net', 'quorumreport.com', 'voiceofoc.org', 'tuscaloosanews.com', 'newtimesslo.com', 'lacrossetribune.com', 'sfbg.com', 'telegram.com', 'sanpedronewspilot.com', 'necn.com', 'bismarcktribune.com', 'fox5sandiego.com', 'newsminer.com', 'kcrg.com', 'cbslocal.com', 'concordmonitor.com', 'vita.mn', 'bhcourier.com', 'tucsonsentinel.com', 'argusleader.com', 'thephoenix.com', 'sandiegoreader.com', 'journalgazette.net', 'rgj.com', 'fox19.com', 'naplesnews.com', 'fredericksburg.com', 'vidaenelvalle.com', 'kfbk.com', 'sentinelandenterprise.com', 'swrnn.com', 'onlinesentinel.com', 'billingsgazette.com', 'cbslocal.com', 'capoliticalreview.com', 'missoulian.com', 'kdlt.com', 'times-news.com', 'ebar.com', 'myfoxla.com', 'inglewoodtodaynews.com', 'ksbw.com', 'pleasantonweekly.com', 'gantdaily.com', 'kmjnow.com', 'rafu.com', 'abc3340.com', 'telemundoarizona.com', 'utdailybeacon.com', 'gosanangelo.com', 'klfy.com', 'okgazette.com', 'ksn.com', 'click2houston.com', 'arkansasnews.com', 'nbc24.com', 'fox16.com', 'mynews4.com', 'wtaq.com', 'ksro.com', 'kcra.com', 'signalscv.com', 'morrisdailyherald.com', 'inlandnewstoday.com', 'victoriaadvocate.com', 'newportbeachindy.com', 'krcb.org', 'lbunion.com', 'pasadenajournal.com', 'inlandvalleynews.com']
        results = self._provider.sample("domain:({})".format(" OR ".join(domains)),
                                        dt.datetime(2000, 1, 1), dt.datetime(2022, 7, 1))
        assert len(results) > 0
        for s in results:
            assert s['media_name'] in domains

    def test_language_clause(self):
        start_date = dt.datetime(2019, 1, 1)
        end_date = dt.datetime(2019, 2, 1)
        en_results = self._provider.count("language:en", start_date, end_date)
        assert en_results > 0
        en_results = self._provider.sample("language:en", start_date, end_date)
        for s in en_results:
            assert s['language'] == 'en'
        es_results = self._provider.count("language:es", start_date, end_date)
        assert es_results > 0
        es_results = self._provider.sample("language:es", start_date, end_date)
        for s in es_results:
            assert s['language'] == 'es'

    def test_date_clause(self):
        results = self._provider.sample("coronavirus", dt.datetime(2019, 1, 1), dt.datetime(2019, 2, 1))
        assert len(results) > 0
        for r in results:
            assert r['publish_date'].year == 2019

    def test_sample(self):
        results = self._provider.sample("coronavirus", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                        dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        assert len(results) > 0
        for r in results:
            assert 'language' in r
            assert 'media_name' in r
            assert 'media_url' in r
            assert 'title' in r
            assert len(r['title']) > 0
            assert 'publish_date' in r

    def test_item(self):
        STORY_ID = "Y29tLGV0dXJib25ld3Msc3EpLzU2Nzc5Mi90aGUtbGlnaHQtYXQtdGhlLWVuZC1vZi10aGUtY292aWQtMTktdHVubmVs"
        story = self._provider.item(STORY_ID)
        assert len(story['title']) > 0
        assert story['language'] == 'sq'
        assert story['domain'] == 'eturbonews.com'
        assert len(story['snippet']) > 0

    def test_all_items(self):
        query = "trump"
        start_date = dt.datetime(2019, 1, 1)
        end_date = dt.datetime(2019, 3, 1)
        story_count = self._provider.count(query, start_date, end_date)
        # make sure test case is reasonable size (ie. more than one page, but not too many pages
        assert story_count > 0
        assert story_count < 5000
        # now text it
        found_story_count = 0
        for page in self._provider.all_items(query, start_date, end_date):
            assert len(page) > 0
            found_story_count += len(page)
        assert found_story_count == story_count

    def test_top_sources(self):
        results = self._provider.top_sources("coronavirus", dt.datetime(2020, 1, 1), dt.datetime(2020, 2, 1))
        assert len(results) > 0
        last_count = 999999999999
        for r in results:
            assert r['value'] <= last_count
            last_count = r['value']

    def test_top_tlds(self):
        results = self._provider.top_tlds("coronavirus", dt.datetime(2020, 1, 1), dt.datetime(2020, 2, 1))
        assert len(results) > 0
        last_count = 999999999999
        for r in results:
            assert r['value'] <= last_count
            last_count = r['value']

    def test_top_languages(self):
        results = self._provider.top_languages("coronavirus", dt.datetime(2020, 1, 1), dt.datetime(2020, 2, 1))
        assert len(results) > 0
        last_count = 999999999999
        for r in results:
            assert r['value'] <= last_count
            last_count = r['value']
            assert len(r['name']) == 2
