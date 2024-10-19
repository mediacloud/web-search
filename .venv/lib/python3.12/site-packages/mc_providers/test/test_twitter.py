'''
import unittest
import datetime as dt
import copy
import random
import os

from ..twitter import TwitterTwitterProvider

TERM = "robots"

TWITTER_API_BEARER_TOKEN = os.getenv('TWITTER_API_BEARER_TOKEN', None)

class TwitterTwitterProviderTest(unittest.TestCase):

    LONG_USER_COLLECTION = ['walmart', 'GM', 'generalelectric', 'Chevron', 'altrianews', 'AIGinsurance', 'AEPnews', 'Boeing', 'Kinder_Morgan', 'HomeDepot', 'jpmorgan', 'cardinalhealth', 'merck', 'StateFarm', 'HPNews', 'McKesson', 'MerrillLynch', 'albertsons', 'FreddieMac', 'JNJNews', 'conoco', 'pfizer_news', 'jcpenney', 'metlife', 'GoldmanSachs', 'Motorola', 'allstate', 'txuenergy', 'UTC', 'DowChemical', 'ConAgraFoods', 'pepsico', 'wellsfargo', 'intel', 'DelphiAuto', 'sprint', 'newyorklife', 'dupont_news', 'georgiapacific', 'disney', 'aetna', 'lockheedmartin', 'Chase', 'tc_talks', 'Phillips66Co', 'HoneywellNow', 'UnitedHealthGrp', 'viacom', 'supervaluPR', 'americanexpress', 'share', 'CVS_Extra', 'lowes', 'BMSNEWS', 'AutoNation', 'centurylink', 'massmutual', 'cigna', 'oracle', 'hcahealthcare', 'raytheon', 'Xerox', 'ZF_TRW', 'abbottglobal', 'nm_news', 'publix', 'TheHartford', 'exelon', 'nationwide', 'XcelEnergyMN', 'mcdonalds', 'KCCorp', 'lordandtaylor', 'goodyearblimp', 'gap', 'northropgrumman', 'hesscorporation', 'halliburton', 'johndeere', 'kodak', 'tigerdirect', 'winndixie', 'Avnet', 'AnthemInc', 'sunocoracing', 'textron', 'edisonintl', 'UnionPacific', 'WasteManagement', 'OfficeDepot', 'williamsupdates', 'toysrus', 'staples', 'CSC', 'DanaHoldingCorp', 'WhirlpoolCorp', 'humana', 'southerncompany', 'MarriottIntl', 'mbna', 'ArrowGlobal', 'mmc_global', 'PSEGdelivers', 'XFINITY', 'aflac', 'KraftHeinzCo', 'colgate', 'thelimited', 'jhboston26', 'BNSFRailway', 'agilent', 'fluorcorp', 'Travelers', 'ThePrincipal', 'ashlandinc', 'SunTrust', 'Dillards', 'MascoCareers', 'americanair', 'napaknowhow', 'txinstruments', 'ppgindustries', 'CSX', 'gillette', 'sempraenergy', 'iheartmedia', 'dte_energy', 'Aramark', 'baxter_intl', 'ChubbInsurance', "kohls", 'progressive', 'applied_blog', 'eatoncorp', 'bnymellon', 'emccorp', 'generalmills', 'SafecoInsurance', 'pncbank', 'nwlrubbermaid', 'omnicom', 'ONEOK', 'avaya', 'navistar', 'Centex_Homes', 'fifththird', 'FirstData', 'lincolnfingroup', 'gannett', 'corninggorilla', 'penskesocial', 'nscorp', 'SAICinc', 'unisyscorp', 'avoninsider', 'NCRCorporation', 'PPLCorp', 'AirProducts', 'StateStreet', 'nordstrom', 'Medtronic', 'EastmanChemCo', 'BHInc', 'PulteHomes', 'DollarGeneral', 'usa_network', 'charlesschwab', 'bjswholesale', 'intent', 'amfam', 'RyderPR', 'ConwayInc', 'bnbuzz', 'autozone', 'radioshack', 'grainger', 'dolepackaged', 'ittcorp', 'kbhome', 'MHFI', 'parkplacetexas', 'NVEnergy', 'AmerenCorp', 'DRHorton', 'QuantumCorp', 'insperity', 'jabil', 'mutualofomaha', 'LeviStraussCo', 'kellyservices', 'etn_electrical', 'CAInc', 'lexmark', 'coxcomm', 'Pathmark', 'amgen', 'MGMResortsIntl', 'dish', 'WestRock', 'spg', 'CDWCorp', 'YorkHVAC', 'amd', 'Steelcase', 'kiewit', 'AveryDennison', 'SEAGATE', 'IberdrolaUSA', 'FirstAmNews', 'ballcorpHQ', 'myfamilydollar', 'biglots', 'CoreMarkHQ', 'shopko', 'PSETalk', 'conocophillips', 'usgcorp', 'NorthernTrust', 'thrivent', 'OGandE', 'trinet', 'anixter', 'chrobinsoninc', 'kindredhealth', 'DevonCareers', 'Sealed_Air', 'hiltonsuggests', 'neimanmarcus', 'hrblock', 'Reebok', 'TrigonIT', 'paylessinsider', 'truevalue', 'United_Rentals', 'uhs_inc', 'ApacheCorp', 'Spherion', 'HCR_ManorCare', 'PolyOne', 'starbucks', 'KrooExpress', 'NVHomes1979', 'sonoco_products', 'mandt_bank', 'FrontierCorp', 'Nicor_Gas', 'agcocorp', 'MichaelsStores', 'amgreetings', 'readersdigest', 'PepcoConnect', 'petsmart', 'Unilever', 'Sabre_Corp', 'firsttennessee', 'roberthalf', 'Huntington_Bank', 'Burlington', 'erie_insurance', 'lpcorp', 'Ecolab', 'BorgWarner', 'weatherfordcorp', 'Convergys', 'valuecityfurn', 'kellwoodcompany', 'belk', 'adi_news', 'wholefoods', 'lazboy', 'hermanmiller', 'budget', 'Tellabs', 'pepboysauto', 'CintasCorp', 'alaskaair', 'outback', 'RAHomes', 'SwiftTransport', 'cunamutualgroup', 'axa_us', 'jbhunt360', 'InsightEnt', 'synovus', 'shopsimon', 'NJNaturalGas', 'compuware', 'WeisMarkets', 'dollartree', 'ProtectiveLife', 'crackerbarrel', 'westerndigital', 'InglesAdvantage', 'WRBerkleyCorp', 'TATravelCenters', 'SunGard', 'CaseysGenStore', 'Safeguard', 'BrownFormanJobs', 'Valspar', 'flowserve', 'bbvacompass', 'fiserv', 'MarshGrocery', 'MagellanHealth', 'sgi_corp', 'JackBox', 'WorthingtonInds', 'Linens_N_Things', 'uhaul', 'windstream', 'rentacenter', 'kennametal', 'beazerhomes', 'DieboldInc', 'ScottsLawnCare', 'NOVGlobal', 'khov', 'SouthernStates', 'Paychex', 'harman', 'CabotCorp', 'energizer', 'XilinxInc', 'EXPDNewsflash', 'flowersfoods', 'quintiles', 'PerkinElmer', 'JoAnn_Stores', 'LandsEnd', 'imperialsugar', 'Champion_Homes', 'ComfortUSA', 'leggmason', 'Level3', 'RGandE', 'lamresearch', 'amkortechnology', 'DelMonte', 'MercuryIns', 'TDBank_US', 'bmcsoftware', 'veritastechllc', 'archcoal', 'AerojetRdyne', 'Atmel', 'AimcoApts', 'EWScrippsCo', 'zebratechnology', 'atmosenergy', 'teradyneinc', 'amwater', 'OReillyAuto', 'arrow1851', 'cadence', 'SportsAuthority', 'Pier1', 'KEMETCapacitors', 'burlington1923', 'nestleusa', 'SNSintl', 'swgas', 'coopfinancecorp', 'officialfye', 'aeo', 'nvidia', 'RoviCorp', 'abercrombie', 'CarpenterTech', 'revlon', 'steinmart', 'hubgroup', 'briggsstratton', 'dnbus', 'AnnTaylor', 'bankofhawaii', 'shoutlet', 'menswearhouse', 'StewartTitleCo', 'one_Werner', 'Amica', 'milacron', 'Intuit', 'Kimball_Intl', 'xocomm', 'earthlink', 'ceridian', 'WatscoInc', 'FXI_MediaPA', 'ModusLink', 'tektronix', 'GenzymeCorp', 'genuitytraits', 'axiallcorp', 'igtnews', 'Sealy', 'SR_Corporate', 'shopstagestores', 'Timberland', 'amsAnalog', 'pcconnection']
    
    def setUp(self):
        self._provider = TwitterTwitterProvider(TWITTER_API_BEARER_TOKEN)
        self._now = dt.datetime.now() - dt.timedelta(minutes=1)  # can't query for right now
        self._5_days_ago = dt.datetime.now() - dt.timedelta(days=5)
        self._30_days_ago = dt.datetime.now() - dt.timedelta(days=30)

    def test_sample(self):
        results = self._provider.sample(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert isinstance(results, list) is True
        for tweet in results:
            assert 'content' in tweet
            assert len(tweet['content']) > 0
            assert 'language' in tweet
            assert len(tweet['language']) == 2

    def test_count(self):
        results = self._provider.count(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert results > 0

    def test_usernames(self):
        results = self._provider.count(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert results > 0
        user_results = self._provider.count(TERM, start_date=self._30_days_ago, end_date=self._now, usernames=['elonmusk'])
        assert results > user_results

    def test_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 6

    def test_longer_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=dt.datetime.now() - dt.timedelta(days=45),
                                                 end_date=self._now)
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 46

    def test_words(self):
        results = self._provider.words(TERM, start_date=dt.datetime.now() - dt.timedelta(days=45),
                                       end_date=self._now)
        last_count = 99999999999
        last_ratio = 1
        for item in results:
            assert last_count >= item['count']
            last_count = item['count']
            assert last_ratio >= item['ratio']
            last_ratio = item['ratio']

    def test_languages(self):
        results = self._provider.languages(TERM, start_date=dt.datetime.now() - dt.timedelta(days=45),
                                           end_date=self._now)
        last_count = 99999999999
        last_ratio = 1
        assert len(results) > 0
        for item in results:
            assert len(item['language']) == 2
            assert last_count >= item['count']
            last_count = item['count']
            assert last_ratio >= item['ratio']
            last_ratio = item['ratio']

    #Does our chunking algorithm correctly chunk
    def test_chunking(self):
        chunked = self._provider._assemble_and_chunk_query_str(TERM, usernames = self.LONG_USER_COLLECTION)
        assert len(chunked) == 8
        assert all([len(q) < self._provider.MAX_QUERY_LENGTH for q in chunked])
    
    
    def test_overlarge_sample(self):
        #Not much you can do to test this guy
        startdate = dt.datetime(2022, 8,22)
        enddate = dt.datetime(2023, 1, 23)

        results = self._provider.sample("money", start_date = startdate, end_date = enddate, usernames = self.LONG_USER_COLLECTION)
        assert len(results) == 10
    
    
    #count just relies on this, so if this works, then count does too
    def test_overlarge_count_over_time(self):
        
        startdate = dt.datetime(2022, 12,22)
        enddate = dt.datetime(2023, 1, 23)

        results = self._provider.count_over_time(TERM, start_date=startdate, end_date=enddate, usernames = self.LONG_USER_COLLECTION)
        
        assert len(results["counts"]) == 7
        
        results_shuffled = self._provider.count_over_time(TERM, start_date=startdate, end_date=enddate, usernames = self.LUC_SHUFFLED())
        assert len(results_shuffled["counts"]) == 7
        
        r_counts = [r["count"] for r in results["counts"]]
        shuffled_counts = [r["count"] for r in results_shuffled["counts"]]
  
        assert sum(r_counts) == sum(shuffled_counts) 
    
        for date in results:
            assert date in results_shuffled
    
    
    def test_overlarge_all_items(self):
        startdate = dt.datetime(2022, 12,1)
        enddate = dt.datetime(2023, 12, 7)

        results = self._provider.all_items(TERM, start_date=startdate, end_date=enddate, usernames = self.LONG_USER_COLLECTION)
        results = list(results)
        results_shuffled = self._provider.all_items(TERM, start_date=startdate, end_date=enddate, usernames = self.LUC_SHUFFLED())
        results_shuffled = list(results_shuffled)
        assert results == results_shuffled
        
    
    def LUC_SHUFFLED(self):
        new_domains = copy.copy(self.LONG_USER_COLLECTION)
        random.shuffle(new_domains)
        return new_domains
'''