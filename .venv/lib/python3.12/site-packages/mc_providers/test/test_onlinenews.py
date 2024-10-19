import unittest
import datetime as dt
import itertools
import random
import copy
import pytest
import mediacloud.api
import os
from typing import List

from mc_providers.onlinenews import OnlineNewsWaybackMachineProvider
from mc_providers import (provider_for, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD,
                          PLATFORM_SOURCE_WAYBACK_MACHINE)

MEDIA_CLOUD_API_KEY = os.getenv('MEDIA_CLOUD_API_KEY', None)

IN_GITHUB_CI_WORKFLOW = os.getenv("GITHUB_ACTIONS") == "true"


class OnlineNewsWaybackMachineProviderTest(unittest.TestCase):

    DOMAINS_OVER_LIMIT = ['bravedefender.ru', 'paulkin.livejournal.com', '1master.livejournal.com', 'alexeymas.livejournal.com', 'marfabaturina.livejournal.com', 'illashenko.livejournal.com', 'i-eron.livejournal.com', 'dziki-dzik.livejournal.com', 'cdplayer.livejournal.com', 'koryo-reporter.livejournal.com', 'sensen.livejournal.com', 'kitp.livejournal.com', 'alexander-smith.livejournal.com', 'pavelkarmanov.livejournal.com', 'sanin.livejournal.com', 'polouact.livejournal.com', 'rousseau.livejournal.com', 'gertman.livejournal.com', 'goering.livejournal.com', 'pro-kuratora.livejournal.com', 'nasralla.livejournal.com', 'podrjadchik.livejournal.com', 'art-quasar.livejournal.com', 'i-am-a-jew-01.livejournal.com', 'alexnilogov.livejournal.com', 'telemont.livejournal.com', 'obezyana.livejournal.com', 'bocharsky.livejournal.com', 'khein.livejournal.com', 'blindkamikadze.livejournal.com', 'mbla.livejournal.com', 'lalibu.livejournal.com', 'ermsworth.livejournal.com', 'phd-paul-lector.livejournal.com', 'ken-v11.livejournal.com', 'redheadrat.livejournal.com', 'yabeda.livejournal.com', 'urus-hay.livejournal.com', 'i-crust.livejournal.com', 'litvinov-studio.livejournal.com', 'trurle.livejournal.com', 'arhiloh.livejournal.com', 'community.livejournal.com', 'gest.livejournal.com', 'nalymov.livejournal.com', 'oswid.livejournal.com', 'optimystic.livejournal.com', 'varera.livejournal.com', 'suhov.livejournal.com', 'tavive.livejournal.com', 'zhsky.livejournal.com', 'grezev.livejournal.com', 'vls-777.livejournal.com', 'geish-a.livejournal.com', 'tacente.livejournal.com', 'brother2.livejournal.com', 'ponka.livejournal.com', 'scottishkot.livejournal.com', 'lqp.livejournal.com', 'comte-de-varand.livejournal.com', 'kirovtanin.livejournal.com', 'fdo-eq.livejournal.com', 'mijas.livejournal.com', 'oetar.livejournal.com', 'shardam22.livejournal.com', 'nataliyaoss.livejournal.com', 'delya-rape.livejournal.com', 'crianza.livejournal.com', 'moscowlondon.livejournal.com', 'gosha-o.livejournal.com', 'vash-pasha.livejournal.com', 'fandaal.livejournal.com', 'dmih.livejournal.com', 'demien-van-cope.livejournal.com', 'zoueji.livejournal.com', 'sashun4a.livejournal.com', 'andy-racing.livejournal.com', 'krupskaja.livejournal.com', 'ishc.livejournal.com', 'sasha-gold.livejournal.com', 'kmaka.livejournal.com', 'nikelin.livejournal.com', 'irina608.livejournal.com', 'dead-dandelion.livejournal.com', 'hitra.livejournal.com', 'zhenyok.livejournal.com', 'seagull-gull.livejournal.com', 'sonozaki-mion.livejournal.com', 'romx.livejournal.com', 'ivanium.livejournal.com', 'bisso.livejournal.com', 'andrey-dma.livejournal.com', 'romanefimov.livejournal.com', 'sergeygipsh.livejournal.com', 'le-mount.livejournal.com', 'meangel.livejournal.com', 'eidograph.livejournal.com', 'afric-dymon.livejournal.com', 'retto.livejournal.com', 'v-bobok.livejournal.com', 'viktop.livejournal.com', 'zooart.livejournal.com', 'gunilla.livejournal.com', 'new-user-name.livejournal.com', 'dama-may.livejournal.com', 'applex.livejournal.com', 'freezeburn.livejournal.com', 'rodich2007.livejournal.com', 'abbra.livejournal.com', 'kouprianov.livejournal.com', 'crll1978.livejournal.com', 'mannaz-russia.livejournal.com', 'alexei-sf.livejournal.com', 'asmodanus.livejournal.com', 'ezhinka.livejournal.com', 'pali-ka.livejournal.com', 'max-rotem.livejournal.com', 'ralfer.livejournal.com', 'toopoy.livejournal.com', '0x0badf00d.livejournal.com', 'jurma.livejournal.com', 'coderoid.livejournal.com', 'rodion-z.livejournal.com', 'bagira.livejournal.com', 'amypp.livejournal.com', 'kunstkamera.livejournal.com', 'freedom-of-sea.livejournal.com', 'sergey-merinov.livejournal.com', 'anton-arhipov.livejournal.com', 'lionet.livejournal.com', 'pavelrogozhin.livejournal.com', 'mursya.livejournal.com', 'yury-lifshits.livejournal.com', 'isolder.livejournal.com', 'keuner.livejournal.com', 'amberss.livejournal.com', 'geleos.livejournal.com', 'druidm.livejournal.com', 'bipping.livejournal.com', 'starcheko.livejournal.com', 'kotovsky.livejournal.com', 'mimikael.livejournal.com', 'caramelina.livejournal.com', 'jc-hobgoblin.livejournal.com', '4thfebruary.livejournal.com', 'viketz.livejournal.com', 'gala108.livejournal.com', 'ilenara.livejournal.com', 'magnatik.livejournal.com', 'flormoriss.livejournal.com', 'lifanov-l-bpyc.livejournal.com', 'lonely-beatle.livejournal.com', 'mimoranilubil.livejournal.com', 'blabba.livejournal.com', 'greatgloomer.livejournal.com', 'zhena.livejournal.com', 'conjuncte.livejournal.com', 'folkvin.livejournal.com', 'perkalaba-real.livejournal.com', 'brutal-hamster.livejournal.com', 'tana-cat.livejournal.com', 'aaaraslanov.livejournal.com', '3ahyga.livejournal.com', 'mcparker.livejournal.com', 'toloknoff.livejournal.com', 'f-ragamuffin.livejournal.com', 'kalashnik.livejournal.com', 'flashtuchka.livejournal.com', 'briukva.livejournal.com', 'grenka666.livejournal.com', 'maydyk.livejournal.com', 'greenforest.livejournal.com', 'anton-lirnik.livejournal.com', 'jhwe.livejournal.com', 'misha-buster.livejournal.com', 'amazanga.livejournal.com', 'g-lide.livejournal.com', 'fufonja.livejournal.com', 'vedmed1969.livejournal.com', 'chaotist.livejournal.com', 'maga-miriam.livejournal.com', 'olga-nebel.livejournal.com', 'skotin.livejournal.com', 'shpengler.livejournal.com', 'soe76.livejournal.com', 'davarix.livejournal.com', 'rurrurur.livejournal.com', 'prool.livejournal.com', 'pierre-amateur.livejournal.com', 'darriuss.livejournal.com', 'varka.livejournal.com', 'pashick.livejournal.com', 'volodyka.livejournal.com', 'runata.livejournal.com', 'a-novgorodsev.livejournal.com', 'kid-06.livejournal.com', 'daryssimo.livejournal.com', '0-stalker-0.livejournal.com', 'squobond.livejournal.com', 'bobagot.livejournal.com', 'kukalyakin.livejournal.com', 'taganay.livejournal.com', '1und20.livejournal.com', 'folic.livejournal.com', 'sergey-sht.livejournal.com', 'silberwe.livejournal.com', 'alex-mischuk.livejournal.com', 'inbell.livejournal.com', 'nix7.livejournal.com', 'ganja-jungle.livejournal.com', 'hellga-kaktus.livejournal.com', 'zurzmansor.livejournal.com', 'yolka-igolka.livejournal.com', 'dee-troy.livejournal.com', 'bekar.livejournal.com', 'irin-v.livejournal.com', 'kurjos.livejournal.com', 'prelestinka.livejournal.com', 'purrik.livejournal.com', 'le-ange-clair.livejournal.com', 'mosquites.livejournal.com', 'maksim-perm.livejournal.com', 'annaol-33.livejournal.com', '5-45x39.livejournal.com', 'stepanishchev-s.livejournal.com', 'skomoroh-roker.livejournal.com', 'ohtori.livejournal.com', 'leontiev.livejournal.com', 'wg-lj.livejournal.com', 'dragonsnest.livejournal.com', 'muhobojka.livejournal.com', 'wanderv.livejournal.com', 'nrkt.livejournal.com', 'bb-msu.livejournal.com', 'olleke-bolleke.livejournal.com', 'maleskiller.livejournal.com', 'voyadger.livejournal.com', 'qwerty765.livejournal.com', 'londo-mallari.livejournal.com', 'smolenski.livejournal.com', 'mvm.livejournal.com', 'velta-1.livejournal.com', 'valer-q.livejournal.com', 'bljakhin-mukher.livejournal.com', 'merihlyund.livejournal.com', 'arcaim.livejournal.com', 'kochenkov.livejournal.com', 'sabitov.livejournal.com', 'streloc84.livejournal.com', 'igaro.livejournal.com', 'beaver-cherokee.livejournal.com', 'helma.livejournal.com', 'samoljot.livejournal.com', 'dssh.livejournal.com', 'daisybirdcorin.livejournal.com', 'olnigami.livejournal.com', 'kitowras.livejournal.com', 'noizy.livejournal.com', 'the-toad.livejournal.com', 'tematic.livejournal.com', 'polyarnick.livejournal.com', 'domohozjayka.livejournal.com', 'nedzume.livejournal.com', 'prokhozhyj.livejournal.com', 'franc-tireur.livejournal.com', 'liveinternet.ru', 'net14.org', 'everstti-rymin.livejournal.com', 'vadeemka.livejournal.com', 'jerom.livejournal.com', 'german-pyatov.livejournal.com', 'evm.livejournal.com', 'chepurga.livejournal.com', 'nif-nif.livejournal.com', 'pamupe-cc.livejournal.com', 'dilesoft.livejournal.com', 'rollog2.livejournal.com', 'ybynad.livejournal.com', 'nl.livejournal.com', 'timoha67.livejournal.com', 'dadrov.livejournal.com', 'dil.livejournal.com', 'uncle-oskar.livejournal.com', 'ivcotto.livejournal.com', 'nektobigfish.livejournal.com', 'arkhip.livejournal.com', 'walter-simons.livejournal.com', 'sedoy-alex.livejournal.com', 'igorsavin.livejournal.com', 'nepilsonis.livejournal.com', 'li111.livejournal.com', 'alxmcr.livejournal.com', 'binhex.livejournal.com', 'runixonline.livejournal.com', 'sumerk.livejournal.com', 'rogozin.livejournal.com', 'globalizator.livejournal.com', 'exobravo.livejournal.com', 'dair-targ-one.livejournal.com', 'bugur.livejournal.com', 'drmax-nn.livejournal.com', 'filonova-olga.livejournal.com', 'lubotsky.livejournal.com', 'ducjarubakina.livejournal.com', 'llivejo.livejournal.com', 'wealth.livejournal.com', 'oip-ru.livejournal.com', 'svijaga.livejournal.com', 'tema.livejournal.com', 'nextlesson.livejournal.com', 'darkcyan.livejournal.com', 'drcrasher.livejournal.com', 'arkagol.livejournal.com', 'kobbi.livejournal.com', 'mcilove.livejournal.com', 'alex-h-gerto.livejournal.com', 'karmapenko.livejournal.com', 'sheney.livejournal.com', 'b-u-d-y-o-n.livejournal.com', 'don-alexey.livejournal.com', 'atua.livejournal.com', 'velski.livejournal.com', 'tilevich.livejournal.com', 'whiteobserver.livejournal.com', 'nor-man-volk.livejournal.com', 'art-aka-primus.livejournal.com', 'olegpavlov.livejournal.com', 'alonna-bud.livejournal.com', 'dead-voice.livejournal.com', 'redshon.livejournal.com', 'vbenedict.livejournal.com', 'beekjuffer.livejournal.com', 'neirolog.livejournal.com', 'golossvyshe.livejournal.com', 'rusglory.livejournal.com', 'vborgman.livejournal.com', 'garriman.livejournal.com', 'northnavi.livejournal.com', 'supermipter.livejournal.com', 'aleks1958.livejournal.com', 'yatsutko.livejournal.com', '2x80.livejournal.com', 'krass.livejournal.com', 'luberblog.ru', 'borminska.livejournal.com', 'nellinch.livejournal.com', 'w-i-s-e.livejournal.com', 'kondratiy.livejournal.com', 'yashar.ru', 'zamiata.livejournal.com', 'leon-85.livejournal.com', 'rem-lat.livejournal.com', 'andrey-fromfili.livejournal.com', 'velesart.livejournal.com', 'ott-morozov.livejournal.com', 'akos.livejournal.com', 'futoi.livejournal.com', 'islamsuluev.livejournal.com', 'devnath.livejournal.com', 'vcurious.livejournal.com', 'dront.livejournal.com', 'blogger-7.livejournal.com', 'onthegreekriots.livejournal.com', 'andronic.livejournal.com', 'exprimo.livejournal.com', 'patalogostilist.livejournal.com', 'ybserver.livejournal.com', 'algrom.livejournal.com', 'transponder.livejournal.com', 'pan-szymanowski.livejournal.com', 'svolkov.livejournal.com', 'taka2001.livejournal.com', 'bob-phaser.livejournal.com', 'a-hramov.livejournal.com', 'g-sim.livejournal.com', 'dharbari.livejournal.com', 'dikaya-murka.livejournal.com', 'vlkamov.livejournal.com', 'o-berezinskaya.livejournal.com', 'dijap.livejournal.com', 'vetumtrud.livejournal.com', 'neo50nick.livejournal.com', 'pinquine.livejournal.com', 'prinzip.livejournal.com', 'syncromechanica.livejournal.com', 'felix-mencat.livejournal.com', 'mamoed.livejournal.com', 'v-miron.livejournal.com', 'k-300.livejournal.com', 'sart.livejournal.com', 'pewrick.livejournal.com', 'empedocl.livejournal.com', 'foxm66.livejournal.com', 'amput.livejournal.com', 'medvejenok-dima.livejournal.com', 'makler116.livejournal.com', 'novizdat.livejournal.com', 'alex-k.livejournal.com', 'cherry-merry.livejournal.com', 'tainka.livejournal.com', 'razori.livejournal.com', 'braginya.livejournal.com', 'ksann.livejournal.com', 'sindikaliz4life.livejournal.com', 'mersedesik.livejournal.com', 'daria-nasonova.livejournal.com', 'sou-rire.livejournal.com', 'zverlesnoy.livejournal.com', 'oleo-press.livejournal.com', 'kaplia-v-more.livejournal.com', 'alkin.livejournal.com', 'hadin.livejournal.com', 'tanyant.livejournal.com', 'petrark.livejournal.com', 'aliceorl.livejournal.com', 'virado.livejournal.com', 'livejournal.com', 'begemout.livejournal.com', 'nofuture-33.livejournal.com', 'kvasy-pingvin.livejournal.com', 'textfield.livejournal.com', 'tannenbaum.livejournal.com', 'cataracty.livejournal.com', 'tumelya.livejournal.com', 'nemo-bonus.livejournal.com', 'ignaty-l.livejournal.com', 'behagen.livejournal.com', 'popuga.livejournal.com', 'crazyhamster.livejournal.com', 'geshefter.livejournal.com', 'che-ratnik.livejournal.com', 'peresedov.livejournal.com', 'picareta.livejournal.com', 'ipodg730.livejournal.com', 'lechimsja.livejournal.com', 'katja777.livejournal.com', 'parvatee.livejournal.com', 'maev-floin.livejournal.com', 'leon-orr.livejournal.com', 'lovingalife.livejournal.com', 'infiniti10.livejournal.com', 'alegz.livejournal.com', 'aniskin1968.livejournal.com', 'alex-odessa.livejournal.com', 'alexandra-2.livejournal.com', 'krolyk.livejournal.com', 'novikov.livejournal.com', 'vasisualij.livejournal.com', 'londres.livejournal.com', 'chaplain-t-rat.livejournal.com', 'yushchuk.livejournal.com', 'frien-dzhi.livejournal.com', 'kapkoff.livejournal.com', 'sholom.livejournal.com', 'terion-fallen.livejournal.com', 'snorri-di.livejournal.com', 'nordling.livejournal.com', '13-dead.livejournal.com', 't-hex.livejournal.com', 'big-fracer.livejournal.com', 'nick-coll.livejournal.com', 'dengi-zlo.livejournal.com', 'lady-coffee.livejournal.com', 'hellga-women.livejournal.com', 'abraxiss.livejournal.com', 'zhem-chug.livejournal.com', 'annory.livejournal.com', 'nikole-t.livejournal.com', 'dqs.livejournal.com', 'mash-ka.livejournal.com', 'digitype.livejournal.com', 'stantoon.livejournal.com', 'alexjourba.livejournal.com', 'neresident.livejournal.com', 'mick-dimos.livejournal.com', 'verymadrabbit.livejournal.com', '76-dragon.livejournal.com', 'bobby-long.livejournal.com', 'sonce-viter.livejournal.com', 'ya.ru', 'maggot-pnz.livejournal.com', 'lugovaya-arfa.livejournal.com', 'kav2009.livejournal.com', 'snaf-omsk.livejournal.com', 'aspammer.livejournal.com', 'mrblackdog.livejournal.com', 'mrakobedova.ru', 'blogolep.ru', 'lisena1408.livejournal.com', 'god-n-devil-inc.livejournal.com', 'olhanninen.livejournal.com', 'alkonawt.livejournal.com', 'tehnoman.livejournal.com', 'doloj-sup.livejournal.com', 'nmp1925.livejournal.com', 'moscow-treasure.livejournal.com', 'arionablog.livejournal.com', 'chromodinamus.livejournal.com', 'elfiangel.livejournal.com', 'dfase.livejournal.com', 'anaeill.livejournal.com', 'nadin-ivolga.livejournal.com', 'yaumka.livejournal.com', 'riidekast.livejournal.com', 'valtra.livejournal.com', 'aurfin76.livejournal.com', 'nesoroka.livejournal.com', 'v-katin.livejournal.com', 'jk289.livejournal.com', 'chitrow.livejournal.com', 'andrei-naliotov.livejournal.com', 'alaverin.livejournal.com', 'eyra-0501.livejournal.com', 'nadia-yacik.livejournal.com', 'viromiro.livejournal.com', 'cheeha.livejournal.com', 'nevinodel.livejournal.com', 'yuss.livejournal.com', 'fesstagere.livejournal.com', 'pavell.livejournal.com', 'vesoeg.livejournal.com', 'nebo-samolet.livejournal.com', 'd-i-c-h.livejournal.com', 'nettslov.livejournal.com', 'pingvinko.livejournal.com', 'kulhazker.livejournal.com', 'w1ndg1rl.livejournal.com', 'iletskaya.livejournal.com', 'psychomodo.livejournal.com', 'current-book.livejournal.com', 'marussia.livejournal.com', 'obzor-inolit.livejournal.com', 'karasseff.livejournal.com', 'yettergjart.livejournal.com', 'gaika-tool.livejournal.com', 'silvertvar.livejournal.com', 'husainov.livejournal.com', 'mikhail-epstein.livejournal.com', 'delphinov.livejournal.com', 'lisbetina.livejournal.com', 'gryzlov.livejournal.com', 'tivi-2.livejournal.com', 'a-rusak.livejournal.com', 'kindergod.livejournal.com', 'rev-agafangelos.livejournal.com', 'anromashka.livejournal.com', 'mrakobes-artem.livejournal.com', 'odziy.livejournal.com', '3ilot.livejournal.com', 'ihtisss.livejournal.com', 'simply-tatiana.livejournal.com', 'led-zeppelined.livejournal.com', 'dionissios.livejournal.com', 'aksion-esti.livejournal.com', 'asya-kareva.livejournal.com', 'toy-marker.livejournal.com', 'unibaken.livejournal.com', 'tanasquel.livejournal.com', 'nettless.livejournal.com', 'croissante.livejournal.com', 'almandinka.livejournal.com', 'dvdemin.livejournal.com', 'alexdsp.livejournal.com', 'a-vistababy.livejournal.com', 'a-dima-v.livejournal.com', 'torderiul.livejournal.com', 'novozemelets.livejournal.com', 'clear-moon.livejournal.com', 'doktor-gilin.livejournal.com', 'koldoeb.livejournal.com', '7-roses.livejournal.com', 'mgmblowup.livejournal.com', 'ksyush-kaz.livejournal.com', 'dpni36.livejournal.com', 'v-axa.livejournal.com', 'la-cebra.livejournal.com', 'dushen.livejournal.com', 'dglive.livejournal.com', 'iqmena.livejournal.com', 'shuvayev.livejournal.com', 'dmitry-siniak.livejournal.com', 'gurzuff.livejournal.com', 'g-r-p.livejournal.com', 'chuchundra-mc.livejournal.com', 'emelushka.livejournal.com', 'hrenov-drummer.livejournal.com', 'ushainlove.livejournal.com', 'perfect-a.livejournal.com', 'ya-exidna.livejournal.com', 'geroczka.livejournal.com', 'tipaa-etaa.livejournal.com', 'zheton4ik.livejournal.com', 'zlovredina.livejournal.com', 'in-oneself.livejournal.com', 'ratka.livejournal.com', 'ilya-compman.livejournal.com', 'dmitry-tatarsky.livejournal.com', 'stranger21.livejournal.com', 'a-rasskazov.livejournal.com', 'padonak1983.livejournal.com', 'mikerd.livejournal.com', 'kris-reid.livejournal.com', 'torian-kelus.livejournal.com', 'p0grebizhskaya.livejournal.com', 'garkushev.livejournal.com', 'c-o-r-w-i-n.livejournal.com', 'savanda.livejournal.com', 'uuu-2.livejournal.com', 'chert999.livejournal.com', 'molnija.livejournal.com', 'vodennikov.livejournal.com', 'bragori.livejournal.com', 'ivry.livejournal.com', 'chernyshkov.livejournal.com', 'olgavals88.livejournal.com', 'grey-koala.livejournal.com', 'abuela-ama.livejournal.com', 'rumitch.livejournal.com', 'lana-1909.livejournal.com', 'aerrandil.livejournal.com', 'rubstein.livejournal.com', 'vologodski.livejournal.com', 'tihomir-e.livejournal.com', 'natterjack.livejournal.com', 'm-tsyganov.livejournal.com', 'cahek-mb.livejournal.com', 'almakedonskij.livejournal.com', 'thesz.livejournal.com', 'k-s-u-s-h-a.livejournal.com', 'don-beaver.livejournal.com', 'esso-besso.livejournal.com', 'huglaro.livejournal.com', 'mashiki.livejournal.com', 'novy-chitatel.livejournal.com', 'serov.livejournal.com', 'szturman.livejournal.com', 'ars-el-scorpio.livejournal.com', 'dingir.livejournal.com', 'dj-yuter.livejournal.com', 'evgenyii.livejournal.com', 'w-bf.livejournal.com', 'fortunebaloven.livejournal.com', 'bnktop.livejournal.com', 'missseeya.livejournal.com', 'parakhod.livejournal.com', 'gooddata.livejournal.com', '5at.livejournal.com', 'furious-lamb.livejournal.com', 'primusoid.livejournal.com', 'lilianitta.livejournal.com', 'safety-magic-ru.livejournal.com', 'esteldeirdre.livejournal.com', 'agnija8.livejournal.com', 'styyh.livejournal.com', 'el-gato.livejournal.com', 'andrey-pusher.livejournal.com', 'naka-minsk.livejournal.com', 'lincse.livejournal.com', 'satforest.livejournal.com', 'vsempesdets.livejournal.com', 'sleepless-in-z.livejournal.com', 'fedorov-ekb.livejournal.com', 'alexsasha.livejournal.com', 'radiobite.livejournal.com', 'garazh.livejournal.com', 'zench.livejournal.com', 'dzhigitka.livejournal.com', 'saint-erasty.livejournal.com', 'kassidi.livejournal.com', 'gelutka.livejournal.com', 'bronepoezd.livejournal.com', 'dashca-enotik.livejournal.com', 'popgapon.livejournal.com', 'fingy.livejournal.com', 'sabbath-shadow.livejournal.com', 'sabeloff.livejournal.com', 'pepsin.livejournal.com', 'aleksandr-ionov.livejournal.com', 'muhazeze.livejournal.com', 'grey-pink.livejournal.com', 'ferike.livejournal.com', 'new-shorec.livejournal.com', 'blacksun-rise.livejournal.com', 'screw-all.livejournal.com', 'none-smilodon.livejournal.com', 'logvynenko.livejournal.com', 'lisovi-ravlyki.livejournal.com', 'galinaaksyenova.livejournal.com', 'aandrusiak.livejournal.com', 'induktor.livejournal.com', 'panzerknakke.livejournal.com', 'groben.livejournal.com', 'znamenosets.livejournal.com', 'voffka.livejournal.com', 'daf-andrew.livejournal.com', 'totaltelecom.livejournal.com', 'gas-ton.livejournal.com', 'mudzhyri.livejournal.com', 'loudurr.livejournal.com', 'pani-grunia.livejournal.com', 'vchych.livejournal.com', 'promonaut.livejournal.com', 'essetil.livejournal.com', 'greta-pinder.livejournal.com', 'giulial.livejournal.com', 'shinshillko.livejournal.com', 'vasiliska-best.livejournal.com', 'pinkerton007.livejournal.com', 'jo-lav.livejournal.com', 'white-leaflet.livejournal.com', 'ryblevv.livejournal.com', 'life-monkey.livejournal.com', 'shamilageev69.livejournal.com', 'top-new.livejournal.com', 'kkatya.livejournal.com', 'mozgotraxer.livejournal.com', 'alex-dent.livejournal.com', 'maiscaia.livejournal.com', 'grafchitaru.livejournal.com', 'mister-tt.livejournal.com', 'resexuality.livejournal.com', 'bilet-na-vbixod.livejournal.com', 'nagval-22.livejournal.com', 'mademoizell.livejournal.com', 'polkovnikkk.livejournal.com', 'femdomina.livejournal.com', 'boormistroff.livejournal.com', 'foxylady25.livejournal.com', 'cheburakl.livejournal.com', 'natella-mik.livejournal.com', 'mark-the-jew.livejournal.com', 'artnick.livejournal.com', 'leon-web.livejournal.com', 'stas-allov.livejournal.com', 'valal.livejournal.com', 'ya-domovoy.livejournal.com', 'freez777.livejournal.com', 'pavean.livejournal.com', 'filrulit.livejournal.com', 'rualkori.livejournal.com', 'noliya.livejournal.com', 'toniacat.livejournal.com', 'lenusik1210.livejournal.com', 'leafleta.livejournal.com', 'pitomza.livejournal.com', 'zoa-mel-gustar.livejournal.com', 'lekssus.livejournal.com', 'annasm.livejournal.com', 'lucky-fire.livejournal.com', 'belskikhoa.livejournal.com', 'cheburyan.livejournal.com', 'annasurgut.livejournal.com', 'eneki.livejournal.com', 'jelounov.livejournal.com', 'salty-ddog.livejournal.com', 'doljka.livejournal.com', '3hvost.livejournal.com', 'elven-luinae.livejournal.com', 'lissoit.livejournal.com', 'football-fan.livejournal.com', 'natashking.livejournal.com', 'dieter2004.livejournal.com', 'yulia-m.livejournal.com', 'shukin.livejournal.com', 'kotenk-a.livejournal.com', 'prepodvypodvert.livejournal.com', 'kudrya-shka.livejournal.com', 'i-landisheva.livejournal.com', 'gerraa.livejournal.com', 'e-belov.livejournal.com', 'dairin-lopes.livejournal.com', 'gemini-snake.livejournal.com', 'liland-palmer.livejournal.com', 'wild-gia.livejournal.com', 'hinhilla.livejournal.com', 'lily-crystall.livejournal.com', 'akrena.livejournal.com', 'meerinjsenevaja.livejournal.com', 'sempre-idem.livejournal.com', 'sairon.livejournal.com', 'n-ariel.livejournal.com', 'argonaerrenfild.livejournal.com', 'malvinka-irk.livejournal.com', 'resonata.livejournal.com', 'olshananaeva.livejournal.com', 'anaris.livejournal.com', 'doloras.livejournal.com', 'alonso-kexano.livejournal.com', 'capsolo.livejournal.com', '50u15pec7a70r.livejournal.com', 'lera-posmitnaya.livejournal.com', 'isk-ra-ru.livejournal.com', 'bragin-sasha.livejournal.com', 'poru4ik.livejournal.com', 'kozharik.livejournal.com', 'bigstonedragon.livejournal.com', 'rooosha.livejournal.com', 'ufik.livejournal.com', 'pan-terra.livejournal.com', 'vonstrang.livejournal.com', 'teafi.livejournal.com', 'uksus-eddik.livejournal.com', 'nale.livejournal.com', 'una-ragazza-o.livejournal.com', 'lis24.livejournal.com', 'selezneva.livejournal.com', 'frau-perez.livejournal.com', 'eosiringa.livejournal.com', 'jein-gallaher.livejournal.com', 'jolli-b.livejournal.com', 'mooseyaka.livejournal.com', 'usolt.livejournal.com', 'lafinur.livejournal.com', 'dargot.livejournal.com', 'from-ulyanowsk.livejournal.com', 'worvik.livejournal.com', 'palitekanom.livejournal.com', 'l-u-f-t.livejournal.com', 'anei-aka-kirian.livejournal.com', 'strangerbel.livejournal.com', 'mojo-fm.livejournal.com', 'kauboj.livejournal.com', 'k-atamanchik.livejournal.com', 'idiotcol.livejournal.com', 'ya34534.livejournal.com', 'treevkin.livejournal.com', 'abpaximov.livejournal.com', 'zuban-leb.livejournal.com', 'ananda-sh.livejournal.com', 'robustov.livejournal.com', 'dictator-of-rus.livejournal.com', 'lgfoto.livejournal.com', 'strogaya-anna.livejournal.com', 'velo-de-isis.livejournal.com', 'halina.livejournal.com', 'dervish-y.livejournal.com', 'd-i-a-n-a-n-a-s.livejournal.com', 'alkhimik.livejournal.com', 'angel-xiligan.livejournal.com', 'shergi.livejournal.com', 'wild-boris.livejournal.com', 'fresh-dance.livejournal.com', 'lidth.livejournal.com', 'chauvin.livejournal.com', 'ap0stle.livejournal.com', 'smallstorm.livejournal.com', 'chzhuchi.livejournal.com', 'bestiya-v.livejournal.com', 'jelly2.livejournal.com', 'caracalla.livejournal.com', 'vesnushka-l.livejournal.com', 'dranik.livejournal.com', 'spiculator.livejournal.com', 'novill.livejournal.com', 'iofan.livejournal.com', 'estellgreydaw.livejournal.com', 'n-g-u.livejournal.com', 'drakonit.livejournal.com', 'raptor-r.livejournal.com', 'solnzevorot.livejournal.com', 'isramir.livejournal.com', 'nataassa.livejournal.com', 'elkek.livejournal.com', 'andrey-grafov.livejournal.com', 'abu-tir.livejournal.com', 'profi.livejournal.com', 'lenin91.livejournal.com', 'guccio.livejournal.com', 'romariolopes.livejournal.com', 'psisa.livejournal.com', 'vintovkin.livejournal.com', '1ann.livejournal.com', 'avoid-it.livejournal.com', 'gusmans-smile.livejournal.com', 'nesvorotnik.livejournal.com', 'ak-hunta.livejournal.com', 'lay-zzz.livejournal.com', 'zalizyaka.livejournal.com', 'ne-zakat.livejournal.com', 'noother-na-mes.livejournal.com', 'david-beholder.livejournal.com', 'dzeso.livejournal.com', 'eezee07.livejournal.com', 'haidamaka14.livejournal.com', 'maxim.livejournal.com', 'alphyna.livejournal.com', 'dedgo.livejournal.com', 'demidov.livejournal.com', 'hazimir-fenring.livejournal.com', 'omoses.livejournal.com', 'arno1251.livejournal.com', 'belnetmon.livejournal.com', 'belyrabbit.livejournal.com', 'comrade-voland.livejournal.com', 'cook.livejournal.com', 'd-m-vestnik.livejournal.com', 'di09en.livejournal.com', 'donnerverter.livejournal.com', 'drugoi.livejournal.com', 'eckero.livejournal.com', 'greenbat.livejournal.com', 'hermit-2005.livejournal.com', 'karabyka.livejournal.com', 'kiowa-mike.livejournal.com', 'matros-kruzhkin.livejournal.com', 'meganick.livejournal.com', 'my-best-pic.livejournal.com', 'nickispeaki.livejournal.com', 'plesser.livejournal.com', 'sandakov.livejournal.com', 'signifer-xiii.livejournal.com', 'skotic.livejournal.com', 'ugolzreniia.livejournal.com', 'viktorianec.livejournal.com', 'gunter-spb.livejournal.com', 'dimasmol.livejournal.com', 'konfuzij.livejournal.com', 'romanemo.livejournal.com', 'rubir-ru.livejournal.com', 'tseitlin.livejournal.com', 'v-novikov.livejournal.com', 'catherine-catty.livejournal.com', 'budovskiy.livejournal.com', 'crivelli.livejournal.com', 'ekishev-yuri.livejournal.com', 'laragull.livejournal.com', 'dimitry-brest.livejournal.com', 'drenoff.livejournal.com', 'gunter23.livejournal.com', 'sammy-belarus.livejournal.com', 'dtremens.livejournal.com', 'dvaki.livejournal.com', 'evgendalf.livejournal.com', 'margaryn.livejournal.com', 'vasilyevna.livejournal.com', 'vovse-ne.livejournal.com', 'wingwave.livejournal.com', '31svoboda.livejournal.com', 'agitator-mass.livejournal.com', 'blacky-sergei.livejournal.com', 'drandin.livejournal.com', 'may-antiwar.livejournal.com', 'ra2005.livejournal.com', 'sergey-shpp.livejournal.com', 'tay-kuma.livejournal.com', 'zmagarka.livejournal.com', 'liout.livejournal.com', 'dkuzmin.livejournal.com', 'kinanet.livejournal.com', 'otez-dimitriy.livejournal.com', '0-i-like-it.livejournal.com', 'artur-s.livejournal.com', 'dan-i-ya.livejournal.com', 'feduta.livejournal.com', 'fr-hamlet.livejournal.com', 'karina-yem.livejournal.com', 'kilko89.livejournal.com', 'mad-in-head.livejournal.com', 'morenwen.livejournal.com', 'rod-julian.livejournal.com', 'rus-antichrist.livejournal.com', 'solar-kitten.livejournal.com', 'solovushka.livejournal.com', 'surmiseksenia.livejournal.com', 'sverhrazum.livejournal.com', 'tanya-silver.livejournal.com', 'thorward.livejournal.com', 'vovkashaman.livejournal.com', 'yulushka.livejournal.com', 'zmoj.livejournal.com', 'b-e-z-fanatizma.livejournal.com', 'eugene-miller.livejournal.com', 'flamingovv.livejournal.com', 'hans-zivers.livejournal.com', 'kozhekin.livejournal.com', 'kukaev.livejournal.com', 'mentbuster.livejournal.com', 'andber.livejournal.com', 'andymat.livejournal.com', 'aspettami.livejournal.com', 'aurum-aka-miko.livejournal.com', 'autoracer.livejournal.com', 'detpixto.livejournal.com', 'doc-namino.livejournal.com', 'eluniel.livejournal.com', 'gtn.livejournal.com', 'hellarider.livejournal.com', 'impartial-lady.livejournal.com', 'lavncelot.livejournal.com', 'manga-manga.livejournal.com', 'margo-na.livejournal.com', 'marjanaharkonen.livejournal.com', 'mawerick.livejournal.com', 'mojito-tale.livejournal.com', 'mouse-in-vitro.livejournal.com', 'nail-helgi.livejournal.com', 'nari-gordon.livejournal.com', 'olenka-plushka.livejournal.com', 'sheerperversity.livejournal.com', 'sympotyaga.livejournal.com', 'v-kash.livejournal.com', 'wattruska.livejournal.com', 'haldar.livejournal.com', 'liberast-rus.livejournal.com', 'ussrgrenadier.livejournal.com', 'al-vis.livejournal.com', 'fleytist.livejournal.com', 'nikoleta3.livejournal.com', 'tina-it.livejournal.com', 'chich-marin.livejournal.com', 'palychalp.livejournal.com', '517design.livejournal.com', 'ahousekeeper.livejournal.com', '4ornobyl.livejournal.com', 'elaid.livejournal.com', 'asmo-dei.livejournal.com', 'saracinua.livejournal.com', 'mckarlson.livejournal.com', 'usatoday.com', 'dallasnews.com', 'newsday.com', 'tampabay.com', 'ocregister.com', 'sacbee.com', 'indystar.com', 'charlotteobserver.com', 'desmoinesregister.com', 'cqpolitics.com', 'usnews.com', 'forbes.com', 'wsj.com', 'opb.org', 'cleveland.com', 'telegraph.co.uk', 'cnbc.com', 'suntimes.com', 'reuters.com', 'people.com', 'commentarymagazine.com', 'deadline.com', 'thehill.com', 'nationaljournal.com', 'hollywoodreporter.com', 'thewrap.com', 'businessinsider.com', 'cbslocal.com', 'twitlonger.com', 'variety.com', 'archive.org', 'sky.com', 'marketwatch.com', 'rollcall.com', 'apple.com', 'mediaite.com', 'bitly.com', 'nj.com', 'jta.org', 'nationalpost.com', 'gq.com', 'texastribune.org', 'wikipedia.org', 'c-span.org', 'thefiscaltimes.com', 'moveon.org', 'newser.com', 'amazon.com', 'thestate.com', 'publicintegrity.org', 'hollywoodlife.com', 'wsbtv.com', 'usmagazine.com', 'bleacherreport.com', 'complex.com', 'nbcnewyork.com', 'azcentral.com', 'triblive.com', 'inquisitr.com', 'timesofisrael.com', 'abcnews.go.com', 'indiatimes.com', 'ft.com', 'mirror.co.uk', 'bloomberg.com', 'ibtimes.com', 'tweetedtimes.com', 'wbur.org', 'yahoo.com', 'mlive.com', 'monmouth.edu', 'nationalreport.net', '4president.org', 'wkrn.com', 'theminorityreportblog.com', 'abc7chicago.com', 'yougov.com', 'tucson.com', 'theantimedia.org', 'issuehawk.com', 'twibble.io', 'fox2detroit.com', 'theintercept.com', 'electionbettingodds.com', 'aol.com', 'qu.edu', 'particlenews.com', 'zziipp.eu', 'topbuzzapp.com', 'apple.news', 'trendolizer.com']

    def setUp(self):
        self._provider = provider_for(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE, None, None)

    def test_count(self):
        results = self._provider.count("coronavirus", dt.datetime(2023, 11, 1), dt.datetime(2023, 12, 1))
        assert results > 0

    def test_no_results(self):
        results = self._provider.count("madeupword", dt.datetime(2023, 11, 1), dt.datetime(2023, 12, 1))
        assert results == 0

    def test_count_over_time(self):
        results = self._provider.count_over_time("coronavirus", dt.datetime(2023, 11, 1), dt.datetime(2023, 12, 1))
        assert len(results) > 0
        for item in results['counts']:
            assert 'date' in item
            assert 'count' in item
            assert item['count'] > 0

    def test_domain_clause(self):
        domain = "yahoo.com"
        results = self._provider.sample("*",
                                        dt.datetime(2023, 11, 20), dt.datetime(2023, 11, 30),
                                        domains=[domain])
        assert len(results) > 0
        for s in results:
            assert s['media_name'] == domain

    def test_many_domains_clause(self):
        # us regional (1000 limit) as of 2022 July
        domains = ['usatoday.com', 'latimes.com', 'nypost.com', 'nydailynews.com', 'chicagotribune.com', 'chron.com', 'dallasnews.com', 'newsday.com', 'sfgate.com', 'nj.com', 'ajc.com', 'startribune.com', 'tampabay.com', 'ocregister.com', 'sacbee.com', 'stltoday.com', 'miamiherald.com', 'kansascity.com', 'denverpost.com', 'mysanantonio.com', 'baltimoresun.com', 'mercurynews.com', 'jsonline.com', 'orlandosentinel.com', 'sun-sentinel.com', 'dispatch.com', 'newsok.com', 'post-gazette.com', 'bostonherald.com', 'twincities.com', 'omaha.com', 'arkansasonline.com', 'buffalonews.com', 'newsobserver.com', 'courant.com', 'palmbeachpost.com', 'statesman.com', 'pe.com', 'lvrj.com', 'northjersey.com', 'contracostatimes.com', 'fresnobee.com', 'jacksonville.com', 'commercialappeal.com', 'dailynews.com', 'sltrib.com', 'toledoblade.com', 'ohio.com', 'daytondailynews.com', 'tulsaworld.com', 'knoxnews.com', 'thenewstribune.com', 'heraldtribune.com', 'kentucky.com', 'mcall.com', 'thestate.com', 'abqjournal.com', 'washingtontimes.com', 'eastvalleytribune.com', 'dailyherald.com', 'dcist.com', 'laobserved.com', 'sfist.com', 'blueoregon.com', 'politickernj.com', 'nymag.com', 'chicagomag.com', 'mspmag.com', 'alvaradostar.net', 'commercejournal.com', 'commercialrecorder.com', 'dailycommercialrecord.com', 'dentonrc.com', 'elliscountypress.com', 'farmersvilletimes.com', 'focusdailynews.com', 'jcrecordcourier.com', 'heraldbanner.com', 'kaufmanherald.com', 'themonitor.net', 'peoplenewspapers.com', 'postsignal.com', 'terrelltribune.com', 'weatherforddemocrat.com', 'wcmessenger.com', 'wylienews.com', 'nbcdfw.com', 'wfaa.com', 'wbap.com', 'callnewspapers.com', 'news-daily.com', 'newstribune.com', 'theodessan.net', 'stlamerican.com', 'bizjournals.com', 'thedailyrecord.com', 'riverfronttimes.com', 'troyfreepress.com', 'kmov.com', 'ksdk.com', '971talk.com', 'chagrinvalleytimes.com', 'clevelandjewishnews.com', 'csuohio.edu', 'mapleheightspress.com', 'cwruobserver.com', 'wkyc.com', 'wtam.com', 'biscaynetimes.com', 'bocanews.com', 'cggazette.com', 'miaminewtimes.com', 'miamitodaynews.com', 'palmbeachdailynews.com', 'southdadenewsleader.com', 'communitynewspapers.com', 'bizjournals.com', 'wsvn.com', 'cbs12.com', 'wflx.com', '610wiod.com', 'canbyherald.com', 'wweek.com', 'katu.com', 'koinlocal6.com', 'kgw.com', 'opb.org', 'kunptv.com', '1190kex.com', 'examiner-enterprise.com', 'neighbornews.com', 'claremoreprogress.com', 'pawhuskajournalcapital.com', 'sapulpaheraldonline.com', 'urbantulsa.com', 'newson6.com', 'tulsabeacon.com', 'krmg.com', '1170kfaq.com', 'michiganradio.org', 'michigandaily.com', 'wlos.com', 'smokymountainnews.com', 'blueridgenow.com', 'lavozindependiente.com', 'wwnc.com', 'mountainx.com', 'centralillinoisproud.com', 'pjstar.com', 'wtvr.com', 'wric.com', 'chesterfieldobserver.com', 'henricocitizen.com', 'nbc12.com', 'fox23.com', 'ktul.com', 'wmdt.com', 'wday.com', 'enderlinindependent.com', 'nwpr.org', 'thenorthernlight.com', 'ccreporter.com', 'c-ville.com', 'readthehook.com', 'whatcomwatch.org', 'wboc.com', 'bellinghamherald.com', 'lyndentribune.com', 'cascadiaweekly.com', 'kfgo.com', 'doverpost.com', 'cavalierdaily.com', 'nbc29.com', 'dailyprogress.com', 'wina.com', 'wdov.com', 'kgmi.com', 'hpr1.com', 'wsau.com', 'centralwinews.com', 'marshfieldnewsherald.com', 'waow.com', 'wpt.org', 'thecitypages.com', 'wausaudailyherald.com', 'wsaw.com', 'dln.com', 'westlifenews.com', 'cleveland.com', 'community-news.com', 'cleburnetimesreview.com', 'fwweekly.com', 'star-telegram.com', 'itemonline.com', 'murphymonitor.com', 'princetonherald.com', 'parkcitiesnews.com', 'sachsenews.com', 'tjpnews.com', 'rockwallcountynews.com', 'salinereporter.com', 'toysh.livejournal.com', 'gigaom.com', 'eriepa.com', 'reviewtimes.com', 'theregister.co.uk', 'gothamist.com', 'nola.com', 'bhamterminal.com', 'sunnewsonline.com', 'desmoinesregister.com', 'thegazette.com', 'qctimes.com', 'wcfcourier.com', 'siouxcityjournal.com', 'press-citizen.com', 'amestrib.com', 'stormlake.com', 'globegazette.com', 'osceolaiowa.com', 'chronicletimes.com', 'dickinsoncountynews.com', 'spencerdailyreporter.com', 'algona.com', 'thehill.com', 'boston.com', 'wnep.com', 'pennlive.com', 'cbslocal.com', 'mercurynews.com', 'cjonline.com', 'mit.edu', 'ctmirror.org', 'scpr.org', 'austinchronicle.com', 'postandcourier.com', 'wbez.org', 'king5.com', 'washingtonexaminer.com', 'oaoa.com', 'myfoxny.com', 'dailycamera.com', 'robdailynews.com', 'washingtonian.com', 'paloaltoonline.com', 'newschannel6now.com', 'daily-times.com', 'hawaiireporter.com', 'nj.com', 'kswo.com', '850koa.com', 'newarkpostonline.com', 'qconline.com', 'freep.com', 'deseretnews.com', 'wcyb.com', 'bangordailynews.com', 'lasvegassun.com', 'delawareonline.com', 'wdel.com', 'politicspa.com', 'indybay.org', 'texastribune.org', 'washingtonblade.com', 'wgmd.com', 'seattleweekly.com', 'nbcmontana.com', 'timesunion.com', '13wmaz.com', 'newjerseynewsroom.com', 'milforddailynews.com', 'njspotlight.com', 'heraldextra.com', 'timesrecordnews.com', 'cbslocal.com', 'therepublic.com', 'watertowndailytimes.com', 'qsaltlake.com', 'kansan.com', 'courierpostonline.com', 'wickedlocal.com', 'longislandpress.com', 'prairieadvocate.com', 'villagevoice.com', 'kcci.com', 'uticaod.com', 'myfoxdc.com', 'wayneindependent.com', 'lohud.com', 'journalstar.com', 'cronkitenewsonline.com', 'ktna.org', 'roanoke.com', 'suntimes.com', 'metroweekly.com', 'kvue.com', 'publicradio.org', '630wpro.com', 'sacramentopress.com', 'abc57.com', 'wfirnews.com', 'fox13now.com', 'prescottenews.com', 'augusta.com', 'federalnewsradio.com', 'nhpr.org', 'localnews8.com', 'bendbulletin.com', 'wdtv.com', 'ny1.com', 'jewishjournal.com', 'kuow.org', 'washingtoncitypaper.com', 'abcactionnews.com', 'wpri.com', 'pbn.com', 'theepochtimes.com', 'providencephoenix.com', 'lowellsun.com', 'bestofneworleans.com', 'newstimes.com', 'wftv.com', 'heraldonline.com', 'myfoxchicago.com', 'myfoxorlando.com', 'clickorlando.com', 'kpho.com', 'masslive.com', 'uppermichiganssource.com', 'kctv5.com', 'abc-7.com', 'cityandstateny.com', '10news.com', 'vnews.com', 'al.com', 'wtoc.com', 'wsbtv.com', 'amsterdamnews.com', 'theindychannel.com', 'silive.com', 'charlotteobserver.com', 'kusi.com', 'sunshinestatenews.com', 'cbs8.com', 'clarksvilleonline.com', '11alive.com', 'wesh.com', 'mysanfordherald.com', 'nbcmiami.com', 'minnpost.com', 'thedaonline.com', 'nbcsandiego.com', 'fox8.com', 'wdbo.com', 'seattletimes.com', 'wxxinews.org', 'wsav.com', 'elpasotimes.com', 'actionnewsjax.com', 'tallahassee.com', 'rochesterhomepage.net', 'postcrescent.com', 'floridatoday.com', 'nbc-2.com', 'nbcnewyork.com', 'texasinsider.org', 'adn.com', 'citypages.com', '760kfmb.com', 'kvoa.com', 'azcentral.com', 'wishtv.com', 'wmfe.org', 'wjla.com', 'standard.net', 'kmtv.com', 'theithacajournal.com', 'myfoxtampabay.com', 'arkansasmatters.com', 'cbslocal.com', 'vindy.com', 'abc2news.com', 'orlandoweekly.com', 'wsoctv.com', 'wral.com', 'amny.com', 'dailytexanonline.com', 'kfdm.com', 'brooklynpaper.com', 'kplr11.com', 'wsbt.com', 'q13fox.com', 'wmctv.com', 'kspr.com', 'salem-news.com', 'dailycommercial.com', 'independentmail.com', 'ecollegetimes.com', 'ktar.com', 'themonitor.com', 'columbiaspectator.com', 'radioiowa.com', 'stardem.com', 'wdsu.com', 'timesfreepress.com', 'stamfordadvocate.com', 'foxcarolina.com', 'cbslocal.com', 'greenbaypressgazette.com', 'firstcoastnews.com', 'thebostonpilot.com', 'dailyamerican.com', 'local15tv.com', 'wptv.com', '12newsnow.com', 'berkeleydailyplanet.com', 'wtsp.com', 'wtop.com', 'courierpress.com', 'abc15.com', 'myrtlebeachonline.com', 'nbcbayarea.com', 'kmbc.com', 'komonews.com', 'walb.com', 'wwltv.com', 'wavenewspapers.com', 'wbbjtv.com', 'ktvb.com', 'queenstribune.com', 'crainsnewyork.com', 'khou.com', 'azfamily.com', 'portclintonnewsherald.com', 'kshb.com', 'centralmaine.com', 'enewspf.com', 'ktre.com', 'lancasteronline.com', 'detroitnews.com', 'kktv.com', 'winonadailynews.com', 'whiotv.com', 'philadelphiaweekly.com', 'myfoxdetroit.com', 'news10.net', 'nevadaappeal.com', 'baynews9.com', 'bdtonline.com', 'gainesville.com', 'thesuburbanite.com', 'cbslocal.com', 'nbc26.com', 'weartv.com', 'kfoxtv.com', 'tricities.com', 'thenorthwestern.com', 'witn.com', 'clickondetroit.com', 'wspa.com', 'gjsentinel.com', 'nbcwashington.com', 'thejewishstar.com', 'azdailysun.com', 'wbir.com', 'mainlinemedianews.com', 'chicagobusiness.com', 'gazettenet.com', 'blackstarnews.com', 'news9.com', 'capecodonline.com', 'wlox.com', 'islandpacket.com', 'nbcphiladelphia.com', 'lpb.org', 'sfbayview.com', 'fox10tv.com', 'bradenton.com', 'triblive.com', 'wtae.com', 'wndu.com', 'seminolechronicle.com', 'loudountimes.com', 'wctv.tv', 'timesleader.com', 'local10.com', 'news-press.com', 'uvaldeleadernews.com', 'rutlandherald.com', 'midlandsconnect.com', 'usf.edu', 'cdispatch.com', 'riverdalepress.com', 'themonticellonews.com', 'kdvr.com', 'chicagoist.com', 'chicagoreporter.com', '14news.com', 'wistv.com', 'cbslocal.com', 'wxow.com', 'fox40.com', 'democratandchronicle.com', 'news-leader.com', 'ktvu.com', 'poconorecord.com', 'cincinnati.com', 'kgab.com', 'scnow.com', 'thecrimson.com', 'whec.com', 'wyff4.com', 'chicagotribune.com', 'sandiego.com', 'ocala.com', 'beaumontenterprise.com', 'ky3.com', 'wusa9.com', 'dailynewstranscript.com', 'capitolfax.com', 'heraldnet.com', 'goupstate.com', 'dailypress.com', 'nbclosangeles.com', 'wmal.com', 'austindailyherald.com', 'cbslocal.com', 'iberkshires.com', 'spokesman.com', 'reviewjournal.com', 'bnd.com', 'pnwlocalnews.com', 'fridayflyer.com', 'fox45now.com', 'katc.com', 'eldiariony.com', 'wdtn.com', 'wsbradio.com', 'investors.com', 'cbslocal.com', 'rnntv.com', 'hawaiinewsnow.com', 'coshoctontribune.com', 'heralddemocrat.com', 'gcdailyworld.com', 'infozine.com', 'myfoxmemphis.com', 'columbiatribune.com', 'modbee.com', 'news4jax.com', 'weei.com', 'wbaltv.com', 'valdostadailytimes.com', 'phoenixnewtimes.com', 'newstalkradiowhio.com', 'southbendtribune.com', 'independent.com', 'laprensa-sandiego.org', 'missionlocal.org', 'rtumble.com', 'totalcapitol.com', 'westsideobserver.com', 'altadenablog.com', 'calbuzz.com', 'californiascapitol.com', 'capitolweekly.net', 'flashreport.org', 'fogcityjournal.com', 'kpfa.org', 'laist.com', 'noozhawk.com', 'sanfranciscosentinel.com', 'alamedasun.com', 'thealpinesun.com', 'modocrecord.com', 'napavalleyregister.com', 'timespressrecorder.com', 'atascaderonews.com', 'auburnjournal.com', 'placersentinel.com', 'bakersfield.com', 'recordgazette.net', 'desertdispatch.com', 'eastbayexpress.com', 'bhweekly.com', 'canyon-news.com', 'bigbeargrizzly.net', 'inyoregister.com', 'paloverdevalleytimes.com', 'burbankleader.com', 'theimnews.com', 'napavalleyregister.com', 'sierracountyprospect.org', 'thecamarilloacorn.com', 'carmichaeltimes.com', 'coastalview.com', 'cerescourier.com', 'chicoer.com', 'championnewspapers.com', 'americanrivermessenger.com', 'citrusheightsmessenger.com', 'claremont-courier.com', 'coronadonewsca.com', 'dailypilot.com', 'ocweekly.com', 'triplicate.com', 'culvercityobserver.com', 'davisenterprise.com', 'delmartimes.net', 'independentvoice.com', 'ivpressonline.com', 'edhtelegraph.com', 'egcitizen.com', 'thecoastnews.com', 'escalontimes.com', 'times-standard.com', 'thesungazette.com', 'dailyrepublic.com', 'thevillagenews.com', 'fillmoregazette.com', 'folsomtelegraph.com', 'fontanaheraldnews.com', 'advocate-news.com', 'humboldtbeacon.com', 'mountainenterprise.com', 'insidebayarea.com', 'galtheraldonline.com', 'redwoodtimes.com', 'gilroydispatch.com', 'glendalenewspress.com', 'gonzalestribune.com', 'theunion.com', 'greenfieldnews.com', 'gridleyherald.com', 'hmbreview.com', 'hanfordsentinel.com', 'thevalleychronicle.com', 'hesperiastar.com', 'hbnews.us', 'hbindependent.com', 'imperialbeachnewsca.com', 'ledger-dispatch.com', 'kingcityrustler.com', 'kingsburgrecorder.com', 'lacanadaonline.com', 'lajollavillagenews.com', 'coastlinepilot.com', 'lagunabeachindy.com', 'lakeconews.com', 'record-bee.com', 'lincolnnewsmessenger.com', 'independentnews.com', 'lodinews.com', 'lompocrecord.com', 'gazettes.com', 'lbbusinessjournal.com', 'presstelegram.com', 'theloomisnews.com', 'jewishobserver-la.com', 'laweekly.com', 'ladowntownnews.com', 'laopinion.com', 'losbanosenterprise.com', 'maderatribune.com', 'malibutimes.com', 'mammothtimes.com', 'mantecabulletin.com', 'mariposagazette.com', 'appeal-democrat.com', 'mckinleyvillepress.com', 'mendocinobeacon.com', 'almanacnews.com', 'pacificsun.com', 'montecitojournal.net', 'montereyherald.com', 'montereycountyweekly.com', 'lamorindaweekly.com', 'morganhilltimes.com', 'mtshastanews.com', 'mv-voice.com', 'napavalleyregister.com', 'westsideconnect.com', 'ocbj.com', 'theadobepress.com', 'marinij.com', 'oakdaleleader.com', 'sierrastar.com', 'ojaivalleynews.com', 'dailybulletin.com', 'reedleyexponent.com', 'orangevalesun.com', 'orland-press-register.com', 'orovillemr.com', 'desertstarweekly.com', 'avpress.com', 'mercurynews.com', 'pvnews.com', 'paradisepost.com', 'pasadenastarnews.com', 'pasadenaweekly.com', 'pasoroblespress.com', 'mtprogress.net', 'mtdemocrat.com', 'contracostatimes.com', 'ptreyeslight.com', 'recorderonline.com', 'plumasnews.com', 'pomeradonews.com', 'ramonajournal.com', 'ramonasentinel.com', 'iebizjournal.com', 'redbluffdailynews.com', 'redding.com', 'redlandsdailyfacts.com', 'ridgecrestca.com', 'riponrecordnews.com', 'countyrecordnews.com', 'placerherald.com', 'cronicasnewspaper.com', 'bizjournals.com', 'napavalleyregister.com', 'calaverasenterprise.com', 'sbsun.com', 'sddt.com', 'bizjournals.com', 'el-observador.com', 'sfexaminer.com', 'sfweekly.com', 'bizjournals.com', 'thecapistranodispatch.com', 'sanluisobispo.com', 'smdailyjournal.com', 'pacbiztimes.com', 'santacruzsentinel.com', 'santamariasun.com', 'santamariatimes.com', 'smdp.com', 'smmirror.com', 'smobserver.com', 'santapaulatimes.com', 'sonomawest.com', 'selmaenterprise.com', 'soledadbee.com', 'syvnews.com', 'sonomanews.com', 'uniondemocrat.com', 'tahoedailytribune.com', 'recordnet.com', 'lassennews.com', 'goldcountrytimes.com', 'taftmidwaydriller.com', 'tehachapinews.com', 'thearknewspaper.com', 'dailybreeze.com', 'sierrasun.com', 'thefoothillspaper.com', 'visaliatimesdelta.com', 'turlockjournal.com', 'ukiahdailyjournal.com', 'thereporter.com', 'timesheraldonline.com', 'valleycenter.com', 'vcreporter.com', 'vvdailypress.com', 'register-pajaronian.com', 'trinityjournal.com', 'sgvtribune.com', 'whittierdailynews.com', 'willitsnews.com', 'appeal-democrat.com', 'wintersexpress.com', 'dailydemocrat.com', 'sfvbj.com', 'siskiyoudaily.com', 'newsmirror.net', 'hidesertstar.com', 'sandiegomagazine.com', 'thesunrunner.com', 'therip.com', 'thepolypost.com', 'theorion.com', 'csun.edu', 'statehornet.com', 'talonmarks.com', 'cypresscollege.edu', 'lavozdeanza.com', 'elvaq.com', 'lbccviking.com', 'laloyolan.com', 'thecampanil.com', 'theargonaut.net', 'coastreportonline.com', 'pomona.edu', 'theusdvista.com', 'thedailyaztec.com', 'dailycal.org', 'theaggie.org', 'dailybruin.com', 'highlandernews.org', 'ucsdguardian.org', 'ucsf.edu', 'dailytrojan.com', 'bizjournals.com', 'spotlightnews.com', 'amherstbee.com', 'amityvillerecord.com', 'recordernews.com', 'artvoice.com', 'babylonbeacon.com', 'steubencourier.com', 'queenscourier.com', 'bizjournals.com', 'rbj.net', 'canarsiecourier.com', 'thechiefleader.com', 'coopercrier.com', 'the-leader.com', 'oneidadispatch.com', 'dailyfreeman.com', 'dailygazette.com', 'thedailystar.com', 'observertoday.com', '27east.com', 'easthamptonstar.com', 'stargazette.com', 'herkimertelegram.com', 'fltimes.com', 'gcnews.com', 'eveningtribune.com', 'kentonbee.com', 'rochesterlavoz.com', 'lancasterbee.com', 'leaderherald.com', 'leroyny.com', 'massapequapost.com', 'uticaod.com', 'midhudsonnews.com', 'newyorkbeacon.com', 'nypress.com', 'thevillager.com', 'niagarafallsreporter.com', 'niagara-gazette.com', 'nyackvillager.com', 'orchardparkbee.com', 'oswegocountytoday.com', 'pelhamweekly.com', 'poughkeepsiejournal.com', 'pressconnects.com', 'pressrepublican.com', 'westmorenews.com', 'pcnr.com', 'qgazette.com', 'troyrecord.com', 'riverreporter.com', 'timesreview.com', 'romeobserver.com', 'romesentinel.com', 'westmorenews.com', 'saratogatodayonline.com', 'saratogian.com', 'shawangunkjournal.com', 'theneighbornewspapers.com', 'timesreview.com', 'northshoreoflongisland.com', 'oleantimesherald.com', 'qns.com', 'rockawave.com', 'wellsvilledaily.com', 'westsenecabee.com', 'eaglebulletin.com', 'eagle-observer.com', 'skaneatelespress.com', 'theeaglecny.com', 'mpnnow.com', 'palltimes.com', 'thesunnews.net', 'springvillejournal.com', 'portwashington-news.com', 'glencoverecordpilot.com', 'oysterbayenterprisepilot.com', 'farmingdale-observer.com', 'floralparkdispatch.com', 'greatneckrecord.com', 'hicksvillenews.com', 'levittown-tribune.com', 'manhasset-press.com', 'massapequaobserver.com', 'antonnews.com', 'newhydeparkillustrated.com', 'plainviewoldbethpageherald.com', 'theroslynnews.com', 'syossetjerichotribune.com', 'indyeastend.com', 'clarencebee.com', 'cheektowagabee.com', 'eastaurorabee.com', 'gothamgazette.com', 'empirepage.com', 'brooklynrail.org', 'empirestatenews.net', 'auburnpub.com', 'nysun.com', 'rochestercitynewspaper.com', 'cbslocal.com', 'gtweekly.com', 'capradio.org', 'lamag.com', 'kqed.org', 'kpbs.org', 'turnto23.com', 'vcstar.com', 'kcet.org', 'pressdemocrat.com', 'kstp.com', 'montgomeryadvertiser.com', 'annistonstar.com', 'dailynexus.com', 'richmondconfidential.org', 'blackvoicenews.com', 'voiceofsandiego.org', 'newuniversity.org', 'sanjoseinside.com', 'randomlengthsnews.com', 'centralvalleybusinesstimes.com', 'ksby.com', 'thecorsaironline.com', 'jweekly.com', 'thecalifornian.com', 'dailytitan.com', 'mercedsunstar.com', 'solanotempest.net', 'quorumreport.com', 'voiceofoc.org', 'tuscaloosanews.com', 'newtimesslo.com', 'lacrossetribune.com', 'sfbg.com', 'telegram.com', 'sanpedronewspilot.com', 'necn.com', 'bismarcktribune.com', 'fox5sandiego.com', 'newsminer.com', 'kcrg.com', 'cbslocal.com', 'concordmonitor.com', 'vita.mn', 'bhcourier.com', 'tucsonsentinel.com', 'argusleader.com', 'thephoenix.com', 'sandiegoreader.com', 'journalgazette.net', 'rgj.com', 'fox19.com', 'naplesnews.com', 'fredericksburg.com', 'vidaenelvalle.com', 'kfbk.com', 'sentinelandenterprise.com', 'swrnn.com', 'onlinesentinel.com', 'billingsgazette.com', 'cbslocal.com', 'capoliticalreview.com', 'missoulian.com', 'kdlt.com', 'times-news.com', 'ebar.com', 'myfoxla.com', 'inglewoodtodaynews.com', 'ksbw.com', 'pleasantonweekly.com', 'gantdaily.com', 'kmjnow.com', 'rafu.com', 'abc3340.com', 'telemundoarizona.com', 'utdailybeacon.com', 'gosanangelo.com', 'klfy.com', 'okgazette.com', 'ksn.com', 'click2houston.com', 'arkansasnews.com', 'nbc24.com', 'fox16.com', 'mynews4.com', 'wtaq.com', 'ksro.com', 'kcra.com', 'signalscv.com', 'morrisdailyherald.com', 'inlandnewstoday.com', 'victoriaadvocate.com', 'newportbeachindy.com', 'krcb.org', 'lbunion.com', 'pasadenajournal.com', 'inlandvalleynews.com']
        results = self._provider.sample("*",
                                        dt.datetime(2023, 3, 1), dt.datetime(2023, 4, 1),
                                        domains=domains)
        assert len(results) > 0
        discovered_domains = [s['media_name'] for s in results]
        outlier_domains = [d for d in discovered_domains if d not in domains]
        assert len(outlier_domains) == 0

    def test_language_clause(self):
        start_date = dt.datetime(2023, 3, 1)
        end_date = dt.datetime(2023, 4, 1)
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
        results = self._provider.sample("coronavirus", dt.datetime(2023, 3, 1), dt.datetime(2023, 3, 30))
        assert len(results) > 0
        for r in results:
            assert r['publish_date'].year == 2023
            assert r['publish_date'].month == 3
            assert r['publish_date'].day in range(1, 31)

    def test_sample(self):
        results = self._provider.sample("coronavirus", dt.datetime(2023, 3, 1), dt.datetime(2023, 4, 1))
        assert len(results) > 0
        for r in results:
            assert 'language' in r
            assert 'media_name' in r
            assert 'media_url' in r
            assert 'title' in r
            assert len(r['title']) > 0
            assert 'publish_date' in r

    """
    def test_item(self):
        STORY_ID = "Y29tLGV0dXJib25ld3Msc3EpLzU2Nzc5Mi90aGUtbGlnaHQtYXQtdGhlLWVuZC1vZi10aGUtY292aWQtMTktdHVubmVs"
        story = self._provider.item(STORY_ID)
        assert len(story['title']) > 0
        assert story['language'] == 'sq'
        assert story['domain'] == 'eturbonews.com'
        assert len(story['snippet']) > 0
    """

    def test_all_items(self):
        query = "trump"
        start_date = dt.datetime(2024, 1, 10)
        end_date = dt.datetime(2024, 1, 10)
        story_count = self._provider.count(query, start_date, end_date)
        # make sure test case is reasonable size (ie. more than one page, but not too many pages
        assert story_count > 0
        assert story_count < 10000
        # now test it
        found_story_count = 0
        for page in self._provider.all_items(query, start_date, end_date):
            found_story_count += len(page)
        assert found_story_count == story_count

    def test_words(self):
        results = self._provider.words("coronavirus", dt.datetime(2023, 12, 1),
                                       dt.datetime(2023, 12, 5))
        last_count = 99999999999
        for item in results:
            assert last_count >= item['count']
            last_count = item['count']

    def test_top_sources(self):
        results = self._provider.sources("coronavirus", dt.datetime(2023, 11, 1),
                                         dt.datetime(2023, 12, 1))
        assert len(results) > 0
        last_count = 999999999999
        for r in results:
            assert 'source' in r
            assert 'count' in r
            assert r['count'] <= last_count
            last_count = r['count']
        # make sure results unique
        source_names = [r['source'] for r in results]
        assert len(source_names) == len(set(source_names))

    def test_languages(self):
        results = self._provider.languages("Trump", dt.datetime(2023, 11, 1),
                                           dt.datetime(2023, 12, 1))
        last_count = 99999999999
        last_ratio = 1
        assert len(results) > 0
        for item in results:
            assert len(item['language']) == 2
            assert last_count >= item['value']
            last_count = item['value']
            assert last_ratio >= item['ratio']
            last_ratio = item['ratio']

    def test_chunk_large_query(self):
        # Does the chunking functionality work correctly?
        base_query = "test OR base OR query"
        parts = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

        for combination_length, expected_chunks in [(1, 1),(2, 1), (3, 16), (4, 256)]:
            # yeilds lists of strings of len 52, 1326, 22100, 270725 respectively
            test_domains = ["".join(com) for com in itertools.combinations(parts, combination_length)]

            chunked = OnlineNewsWaybackMachineProvider._assemble_and_chunk_query_str(base_query, domains=test_domains)
            # Assert that we get the expected number of chunks for the combination size
            assert len(chunked) == expected_chunks
            # And, more importantly, assert that all the resulting chunks are shorter than the max length
            assert all([len(q) < OnlineNewsWaybackMachineProvider.MAX_QUERY_LENGTH for q in chunked])

    def test_confirm_sample_chunk_query(self):
        base_query = "technology"
        chunked = OnlineNewsWaybackMachineProvider._assemble_and_chunk_query_str(base_query,
                                                                                 domains=self.DOMAINS_OVER_LIMIT)
        assert len(chunked) == 2
        assert all([len(q) < OnlineNewsWaybackMachineProvider.MAX_QUERY_LENGTH for q in chunked])

    def test_confirm_sample_chunk_filter(self):
        base_query = "technology"
        chunked = OnlineNewsWaybackMachineProvider._assemble_and_chunk_query_str(base_query,
                                                                                 filters=self.DOMAINS_OVER_LIMIT)
        assert len(chunked) == 2
        assert all([len(q) < OnlineNewsWaybackMachineProvider.MAX_QUERY_LENGTH for q in chunked])

    def test_confirm_sample_chunk_query_filter_and_domain(self):
        base_query = "technology"
        chunked = OnlineNewsWaybackMachineProvider._assemble_and_chunk_query_str(base_query,
                                                                                 domains=self.DOMAINS_OVER_LIMIT,
                                                               filters=self.DOL_SHUFFLED())
        assert len(chunked) == 4
        assert all([len(q) < OnlineNewsWaybackMachineProvider.MAX_QUERY_LENGTH for q in chunked])

    def test_overlarge_language(self):
        base_query = "technology"
        start_date = dt.datetime(2023, 1, 1)
        end_date = dt.datetime(2023, 12, 1)
        results = self._provider.languages(base_query, start_date, end_date, domains=self.DOMAINS_OVER_LIMIT)
        assert len(results) > 1
        # This pattern is just an extra correctness guarantee - if chunking is implemented correctly, then shuffling
        # the domain order won't effect the output at all.
        results_shuffled = self._provider.languages(base_query, start_date, end_date, domains=self.DOL_SHUFFLED())
        # Since the results might not be in the same order, we compare item-wise
        for language in results:
            assert language in results_shuffled

    def test_overlarge_sources(self):
        base_query = "technology"
        start_date = dt.datetime(2023, 11, 1)
        end_date = dt.datetime(2023, 12, 1)

        results = self._provider.sources(base_query, start_date, end_date, domains=self.DOMAINS_OVER_LIMIT)
        assert len(results) > 10

        results_shuffled = self._provider.sources(base_query, start_date, end_date, domains=self.DOL_SHUFFLED())
        assert len(results_shuffled) > 10

        for source in results:
            assert source in results_shuffled
        # assert results_shuffled == results

    def test_overlarge_words(self):
        """
        # NB: this test is brief because the results of the words query are not safe against chunking
        # I'm not sure what the right behavior is.
        base_query = "technology"
        start_date = dt.datetime(2023, 1, 1)
        end_date = dt.datetime(2023, 12, 1)
        results = self._provider.words(base_query, start_date, end_date, domains=self.DOMAINS_OVER_LIMIT)
        assert len(results) > 0
        results_shuffled = self._provider.words(base_query, start_date, end_date, domains=self.DOL_SHUFFLED())
        assert len(results_shuffled) > 0
        """
        assert True

    def test_overlarge_count_over_time(self):
        start_date = dt.datetime(2023, 12, 1)
        end_date = dt.datetime(2023, 12, 3)

        results = self._provider.count_over_time('*', start_date, end_date, domains=self.DOMAINS_OVER_LIMIT)

        assert len(results["counts"]) == 3

        results_shuffled = self._provider.count_over_time('*', start_date, end_date, domains=self.DOL_SHUFFLED())
        assert len(results_shuffled["counts"]) == 3

        r_counts = [r["count"] for r in results["counts"]]
        shuffled_counts = [r["count"] for r in results_shuffled["counts"]]

        assert sum(r_counts) == sum(shuffled_counts)
        assert results_shuffled == results

    def test_overlarge_count(self):
        start_date = dt.datetime(2023, 1, 1)
        end_date = dt.datetime(2023, 12, 1)

        results = self._provider.count('*', start_date, end_date, domains=self.DOMAINS_OVER_LIMIT)
        assert results > 20000

        results_shuffled = self._provider.count('*', start_date, end_date, domains=self.DOL_SHUFFLED())
        assert results_shuffled == results

    def test_overlarge_sample(self):
        #Not much you can do to test this guy
        base_query = "technology"
        start_date = dt.datetime(2022, 1, 1)
        end_date = dt.datetime(2023, 12, 1)

        results = self._provider.sample(base_query, start_date, end_date, limit=10, domains=self.DOMAINS_OVER_LIMIT)
        assert len(results) == 10

    def DOL_SHUFFLED(self):
        new_domains = copy.copy(self.DOMAINS_OVER_LIMIT)
        random.shuffle(new_domains)
        return new_domains

    def test_directory_and_search(self):
        mc = mediacloud.api.DirectoryApi(MEDIA_CLOUD_API_KEY)
        # find the collection we're interested in
        matching_collections = mc.collection_list(mc.PLATFORM_ONLINE_NEWS, name="United States - National")
        assert len(matching_collections['results']) > 0
        collection = matching_collections['results'][0]
        # get the domains for all the sources within that collection
        offset = 0
        sources = []
        while True:
            response = mc.source_list(collection_id=collection['id'], limit=1000, offset=offset)
            sources += response['results']
            if response['next'] is None:
                break
            offset += len(response['results'])
        domains = [s['name'] for s in sources]
        # then query it for stories with the collection id
        all_stories = []
        max_stories = 4500  # just to make sure it doesn't spin forever
        for page_of_stories in self._provider.all_items("*", dt.datetime(2023, 1, 1),
                                                        dt.datetime(2023, 12, 1), domains=domains):
            assert len(page_of_stories) > 0
            all_stories.extend(page_of_stories)
            if len(all_stories) > max_stories:
                break
        assert len(all_stories) > 0


'''
    def test_top_tlds(self):
        results = self._provider.top_tlds("coronavirus", dt.datetime(2022, 11, 1), dt.datetime(2022, 11, 10))
        assert len(results) > 0
        last_count = 999999999999
        for r in results:
            assert r['value'] <= last_count
            last_count = r['value']

'''


@pytest.mark.skipif(IN_GITHUB_CI_WORKFLOW, reason="requires VPN tunnel to Media Cloud News Search API server")
class OnlineNewsMediaCloudProviderTest(OnlineNewsWaybackMachineProviderTest):

    def setUp(self):
        # this requires having a VPN tunnel open to the Media Cloud production
        self._provider = provider_for(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD, None,
                                      "http://localhost:8010/v1/")

    def test_expanded_story_list(self):
        query = "*"
        start_date = dt.datetime(2020, 1, 1)
        end_date = dt.datetime(2023, 12, 1)
        page1, next_token1 = self._provider.paged_items(query, start_date, end_date, expanded=True, chunk=False)
        assert len(page1) > 0
        for story in page1:
            assert "id" in story
            assert "text" in story
            assert len(story['text']) > 0

    def test_date_formats(self):
        query = "biden"
        start_date = dt.datetime(2023, 11, 25)
        end_date = dt.datetime(2023, 11, 26)
        page1, next_token1 = self._provider.paged_items(query, start_date, end_date, chunk=False)
        for story in page1:
            assert "publish_date" in story
            assert story['publish_date'] is not None
            assert isinstance(story['publish_date'], dt.date)
            assert "indexed_date" in story
            assert story['indexed_date'] is not None
            assert isinstance(story['indexed_date'], dt.datetime)

    def test_paged_items(self):
        query = "biden"
        start_date = dt.datetime(2020, 1, 1)
        end_date = dt.datetime(2023, 12, 1)
        story_count = self._provider.count(query, start_date, end_date, chunk=False)
        # make sure test case is reasonable size (ie. more than one page, but not too many pages
        assert story_count > 1000
        # fetch first page
        page1, next_token1 = self._provider.paged_items(query, start_date, end_date, chunk=False)
        assert len(page1) > 0
        assert next_token1 is not None
        page1_url1 = page1[0]['url']
        # grab token, fetch next page
        page2, next_token2 = self._provider.paged_items(query, start_date, end_date, chunk=False,
                                                        pagination_token=next_token1)
        assert len(page2) > 0
        assert next_token2 is not None
        assert next_token1 != next_token2  # verify paging token changed
        page2_urls = [s['url'] for s in page2]
        assert page1_url1 not in page2_urls  # verify pages don't overlap

    def _test_domain_filters(self, domains: List[str]):
        query = "biden"
        start_date = dt.datetime(2023, 11, 1)
        end_date = dt.datetime(2023, 12, 1)
        page1, _ = self._provider.paged_items(query, start_date, end_date, domains=domains, chunk=False)
        assert len(page1) > 0
        for story in page1:
            assert "url" in story
            assert story['media_name'] in domains
            assert story['media_url'] in domains

    def test_domain_filter(self):
        self._test_domain_filters(["cnn.com"])
        self._test_domain_filters(["cnn.com", "foxnews.com"])

    def test_item(self):
        STORY_ID = "180ddf49e3da7eea5812a35ab06a4f1656e5483649b9a8805bdcfaf4e8284b41"  # a 2024-03-09 story
        story = self._provider.item(STORY_ID)
        assert len(story['title']) > 0
        assert story['language'] == 'en'
        assert story['media_name'] == 'cnn.com'
