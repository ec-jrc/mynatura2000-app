angular.module('nat2000.controllers', ['ngCordova'])


/*
 * App controller
 * ----------------------------------------------------------------------
 */
.controller('AppCtrl', function($scope, CONFIG, SERVER, $rootScope, $state, $stateParams, $ionicModal, $ionicHistory, n2db, n2serv, $sce, $ionicLoading, $ionicPlatform, $cordovaGeolocation, $timeout, $ionicPopup, $translate, $language, $filter) {

    $scope.bar = { barfix: false };

    $rootScope.$on('ionicNativeTransitions.beforeTransition', function() {
        console.log('Transition is about to happen');
    });

    $rootScope.$on('ionicNativeTransitions.success', function() {
        console.log('Transition success');
    });

    $rootScope.$on('ionicNativeTransitions.error', function() {
        console.log('Transition error');
    });

    $scope.selectedLanguage = {
        language: { label: "", idL: "" }
    };


    $ionicPlatform.registerBackButtonAction(function(event) {
        if ($state.current.name == "app.home") {
            //navigator.app.exitApp(); //<-- remove this line to disable the exit
            var $translateWordWord = $filter('translate');
            var confirmPopup = $ionicPopup.confirm({
                title: 'MyNatura2000',
                template: $translateWord('CLSS')
            });

            confirmPopup.then(function(res) {
                if (res) {
                    navigator.app.exitApp();
                } else {
                    console.log('User wants to stay');
                }
            });
        } else {
            navigator.app.backHistory();
        }
    }, 100);

    $scope.main = {};
    $scope.main.title = 'MyNatura2000'; /* This decides the title of the page and can be overwritten by children */
    $scope.main.user = {};
    $scope.main.user.ICCID = '';
    $scope.main.user.ECASName = '';
    $scope.main.user.ECASmail = '';
    $scope.main.user.ECASuniqueID = '';
    $scope.main.connected = true;
	$scope.main.lat = 50.102223;
	$scope.main.lng = 9.254419;
    $scope.main.gotpos = false;
    $scope.main.gotpos_prev = false;
    $scope.main.firstime = 0;
    $scope.logged = false;
    $scope.main.iconLogged = "login_off.png";
    $scope.main.ping = false;
    
    $scope.main.pagingStart = 1;
    $scope.main.pagingEnd = 20;
    $scope.main.userReports = 0;
    
    $scope.main.myReportsScreen = "app.myreports";
    

    
    $ionicPlatform.ready(function() {

        if (screen.width < 767) {
            screen.lockOrientation('portrait');
        } else {
            screen.unlockOrientation();
        }


        $language.get().then(
            function(successLanguage) {
                $translate.use(successLanguage);
                $scope.selectedLanguage.language.idL = successLanguage;
            }
        );


       	$scope.devicePlatform = device.platform;
       	$scope.deviceVersion = device.version;
    	$scope.alertAndroidVersion = 0;
        
        // Check if HTTPS protocol is available for EASIN REST services
        $scope.main.SSL = true;
        if (CONFIG.environment == "PROD") SERVER.serverApiUrl = CONFIG.serverProdApiUrlHttps;
        if (CONFIG.environment == "TEST") SERVER.serverApiUrl = CONFIG.serverTestApiUrlHttps;
        $.ajax({ url: SERVER.serverApiUrl + CONFIG.path_rest + "/count/check_service", timeout: 5000})
        .always(function(answer) {
      	  console.log("Network REST Services: " + answer.status);
      	  if ((answer.status == 200) || (answer.status == 405)) {
      	      $scope.main.SSL = true;
      		  if (CONFIG.environment == "PROD") SERVER.serverApiUrl = CONFIG.serverProdApiUrlHttps;
      		  if (CONFIG.environment == "TEST") SERVER.serverApiUrl = CONFIG.serverTestApiUrlHttps;
      	  } else {
      	      $scope.main.SSL = false;
      		  if (CONFIG.environment == "PROD") SERVER.serverApiUrl = CONFIG.serverProdApiUrlHttp;
      		  if (CONFIG.environment == "TEST") SERVER.serverApiUrl = CONFIG.serverTestApiUrlHttp;
      	  }
      	  /*
      	  console.log(SERVER.serverApiUrl);
      	  console.log($scope.main.SSL);
      	  console.log($scope.devicePlatform);
      	  console.log($scope.deviceVersion);
    	  if (($scope.devicePlatform == "Android") && ($scope.deviceVersion >= "9") && ($scope.alertAndroidVersion == 0) && ($scope.main.SSL !== true)) {
    		  $scope.alertAndroidVersion++;
    		  navigator.notification.alert(
    		    $filter('translate')('android9'),
    		    null,
    		    $filter('translate')('INFN'),
    		    'OK'
    		  );
    	  }
    	  */
        });

        /* setting up alerts */
        $scope.sitealert = { id: '', name: '', type: 0 };
        $ionicModal.fromTemplateUrl('templates/modals/alert.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.alertModal = modal;
        });

        $scope.closeSiteAlert = function() {
            $scope.alertModal.hide();
        };

        /* retrieving geoposition */
        $scope.refreshMainMenuLink = function() {
        	n2db.getReports().then(function(data) {
	            $scope.results = data;
	            if ($scope.results.length > 0) {
	                $scope.main.myReportsScreen = "app.myreports";
	            } else {
	            	if ($scope.logged == false) {
	                    $scope.main.myReportsScreen = "app.myreports";
	            	} else {
	                    $scope.main.myReportsScreen = "app.mysentreports";
	            	}
	            }
	            //console.log($scope.main.myReportsScreen);
	            $timeout(function() { $scope.refreshMainMenuLink(); }, 200);
	        });
        };


        /* retrieving geoposition */
        $scope.refreshPos = function() {
            console.log('refreshing main pos');
            var posOptions = { timeout: 20000, enableHighAccuracy: true };
            if ($scope.main.gotpos != $scope.main.gotpos_prev) {
            	$scope.main.firstime = 0;
            	$scope.main.gotpos_prev = $scope.main.gotpos; 
            }
            
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function(position) {
                    console.log(position.coords);
                    $scope.main.lat = position.coords.latitude;
                    $scope.main.lng = position.coords.longitude;
                    $scope.main.gotpos = true;
                    $timeout(function() { $scope.refreshPos(); }, 1000);
                    
                    n2serv.getNearbySite($scope.main.lat, $scope.main.lng).then(function(site) {
                        if ((site.id !== $scope.sitealert.id) && (site.name.trim() != "")) {
                            $scope.sitealert = site;
                            $scope.alertModal.show();
                        }
                    });
                }, function(err) {
                    $timeout(function() { $scope.refreshPos(); }, 1000);
                });
        }
        $timeout(function() { $scope.refreshPos(); }, 200);
        $timeout(function() { $scope.refreshMainMenuLink(); }, 30);

        /* end retrieving geoposition */

        n2db.getUser().then(function(retrieveduser) {
            $scope.main.user = retrieveduser;
            /* Verify if the user is connected to ECAS and saved on the User DB */
            if ($scope.main.user.ICCID != '') {
                $scope.logged = true;
            } else {
                $scope.logged = false;
            }
            $scope.main.iconLogged = "login_on.png"; 
            if ($scope.logged === false) $scope.main.iconLogged = "login_off.png";
        });
        
        

        /* are you connected? */
        document.addEventListener("offline", onOffline, false);
        document.addEventListener("online", onOnline, false);
    });

    function onOffline() {
        $scope.main.connected = false;
    }


    function onOnline() {
        $scope.main.connected = true;
    }

    $scope.offlineinfo = function() {
        var $translateWord = $filter('translate');
        $ionicLoading.show({
            template: $translateWord('NCNT'),
            duration: 2000
        });
    }


    /* I use this to display a 'saved' message when loading the list of your reports from saving functions */
    $scope.main.onsave = false;


    $scope.myGoBack = function() {
        $ionicHistory.goBack();
    };

    $scope.myGoHome = function() {
        $state.go('app.home');
    };

    $scope.appCtrl = {
        isHeaderMenuOpen: false
    };

    $scope.openExternalLink = function(uri) {
        ionic.Platform.ready(function() {
            cordova.InAppBrowser.open(uri, "_system");
        });
    };

    /* 
    Menu modals
    */


    $ionicModal.fromTemplateUrl('templates/modals/sideModal.html', {
        scope: $scope,
        id: 'sideModal'
    }).then(function(modal) {
        $scope.sideModal = modal;
    });


    $ionicModal.fromTemplateUrl('templates/modals/languageModal.html', {
        scope: $scope,
        id: 'sideModal'
    }).then(function(modal) {
        $scope.languageModal = modal;
    });

    $scope.languagesList = [
        //{label: 'bg - български', idL: "bg"},
        // {label: 'es - Español', idL: "es"},
        // {label: 'cs - Čeština', idL: "cs"},
        // {label: 'da - Dansk', idL: "da"},
        { label: 'de - Deutsch', idL: "de" },
        // {label: 'et - Eesti keel', idL: "et"},
        // {label: 'el - Eλληνικά', idL: "el"},
        { label: 'en - English', idL: "en" },
        {label: 'fr - Français ', idL: "fr"},
        //{label: 'ga - Gaeilge', idL: "ga"},
        // {label: 'hr - Hrvatski', idL: "hr"},
        {label: 'it - Italiano', idL: "it"},
        // {label: 'lv - Latviešu valoda', idL: "lv"},
        // {label: 'lt - Lietuvių kalba', idL: "lt"},
        {label: 'hu - Magyar', idL: "hu"},
        // {label: 'mt - Malti', idL: "mt"},
        // {label: 'nl - Nederlands', idL: "nl"},
        // {label: 'pl - Polski', idL: "pl"},
        // {label: 'pt - Português', idL: "pt"},
        {label: 'ro - Română', idL: "ro"}
        // {label: 'sk - Slovenčina', idL: "sk"},
        // {label: 'sl - Slovenščina', idL: "sl"},
        // {label: 'fi - Suomi', idL: "fi"},
        // {label: 'sv - Svenska', idL: "sv"}
    ];

    $scope.changeLanguage = function(language) {
        $translate.use(language.idL);
        $scope.selectedLanguage.language = language;
        $language.set(language.idL);
        //$state.go('app.home');
    };


    $scope.openMenuModal = function(idModal) {
        //$ionicLoading.show({      template: "Loading..."    });
        $ionicLoading.show({ template: $filter('translate')('LOAD') + "..." });
        console.log('called control with: ' + idModal);
        /// acknowledgement   disclaimer   legalNotice   privacyStatement
        var $translateWord = $filter('translate');
        switch (idModal) {
            case 'acknowledgement':
                $scope.modaltitle = $translateWord('ACKN');
                break;
            case 'disclaimer':
                $scope.modaltitle = $translateWord('DICL');
                break;
            case 'legalNotice':
                $scope.modaltitle = $translateWord('LGLN');
                break;
            case 'privacyStatement':
                $scope.modaltitle = $translateWord('PVCY');
                break;
            case 'language':
                $ionicLoading.hide();
                $scope.languageModal.show();
                return true;
                break;
            default:
                $scope.modaltitle = $translateWord('IFFN');
        }
        //$ionicLoading.show({      template: "Loading..."    });

        n2db.getStatic(idModal, $scope.selectedLanguage.language.idL).then(function(code) {
            //$scope.modalcode=$sce.trustAsHtml(code);
            $scope.modalcode = code;
            $ionicLoading.hide();
            $scope.sideModal.show();
        });



    };

    $scope.closeMenuModal = function(idModal) {
        if (idModal == 'language') {
            $scope.languageModal.hide();
            console.log($state.current.name);
            if ($state.current.name == "app.home") $scope.main.title = "MyNatura2000"; 
            if ($state.current.name == "app.list") $scope.main.title = $filter('translate')('STLS'); 
            if ($state.current.name == "app.map") $scope.main.title = $filter('translate')('STMP'); 
            if ($state.current.name == "app.report") $scope.main.title = $filter('translate')('RPTT'); 
            if ($state.current.name == "app.reportobservation") $scope.main.title = $filter('translate')('RPOB'); 
            if ($state.current.name == "app.reportfeedback") $scope.main.title = $filter('translate')('RPFB'); 
            if ($state.current.name == "app.myreports") $scope.main.title = $filter('translate')('MYRP'); 
            if ($state.current.name == "app.mysentreports") $scope.main.title = $filter('translate')('MYRP'); 
            if ($state.current.name == "app.login") $scope.main.title = $filter('translate')('LGINTLT'); 
            if ($state.current.name == "app.about") {
                /*
                var $translateWord = $filter('translate');
                $scope.main.title = $translateWord('ABBT');
                $ionicLoading.show({ template: $translateWord('LDNG') + "..." });
                n2db.getStatic('about', $scope.selectedLanguage.language.idL).then(function(code) {
                	code = code.replace("(v-.-)", "(v" + CONFIG.version + ")");
                    $scope.modalcode = code;
                    console.log($scope.modalcode);
                    $ionicLoading.hide();
                });
                */
            	$state.go('app.home');
            }
    		if ($scope.pics.length < 2) {
                if ($scope.selectedLanguage.language.idL == "en") $scope.pics = [CONFIG.nocon_en];
        		if ($scope.selectedLanguage.language.idL == "it") $scope.pics = [CONFIG.nocon_it];
        		if ($scope.selectedLanguage.language.idL == "de") $scope.pics = [CONFIG.nocon_de];
        		if ($scope.selectedLanguage.language.idL == "fr") $scope.pics = [CONFIG.nocon_fr];
        		if ($scope.selectedLanguage.language.idL == "hu") $scope.pics = [CONFIG.nocon_hu];
        		if ($scope.selectedLanguage.language.idL == "ro") $scope.pics = [CONFIG.nocon_ro];
    		}
        } else {
            $scope.sideModal.hide();
        }
    };

})

/*
 * Home page controller
 * ----------------------------------------------------------------------
 */
.controller('HomeCtrl', function($scope, $filter) {
    $scope.main.title = 'MyNatura2000';
})


/*
 * About controller
 * ----------------------------------------------------------------------
 */
.controller('AboutCtrl', function($scope, CONFIG, SERVER, $ionicLoading, n2db, $sce, $filter) {
    var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('ABBT');
    $ionicLoading.show({ template: $translateWord('LDNG') + "..." });
    n2db.getStatic('about', $scope.selectedLanguage.language.idL).then(function(code) {
    	if (CONFIG.environment == "TEST") code = code.replace("(v-.-)", "(v" + CONFIG.version + ") TEST");
    	if (CONFIG.environment == "PROD") code = code.replace("(v-.-)", "(v" + CONFIG.version + ")");
        $scope.modalcode = code;
        $ionicLoading.hide();
    });
})


/*
 * List sites controller
 * ----------------------------------------------------------------------
 */
.controller('ListCtrl', function($scope, n2serv, $ionicModal, $timeout, $filter) {
	var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('STLS');

    $scope.countries = n2serv.getCountries();
    $scope.percentage = 0;

    /* loading the list 100 sites at time */
    $scope.loadList = function(limit) {
        //console.log($translateWord('LDNG') + ", " + limit);
        var newpart = n2serv.getSiteListPartial(limit);
        $scope.sites = $scope.sites.concat(newpart);
        changeType($scope.sites);
        if (newpart.length == 100) {
            limit += 100;
            $timeout(function() { $scope.loadList(limit); }, 100);
            $scope.percentage = Math.round((limit * 100) / 27510); /* 17800 showing a loading percentage in order to reassure users */
        } else {
            $scope.percentage = 100;
        }
    }

    $scope.percentage = 100;
    $scope.sites = n2serv.getSiteListAll();
    changeType($scope.sites);
    //$scope.sites = n2serv.getSiteListPartial(0);
    //$timeout(function() { $scope.loadList(100); }, 500);

    // This function is used to remap sites type with the code used by EEA
    function changeType(data){
    	for(var i = 0; i < data.length; i++){
    		if (data[i]["SITETYPE"] == "A") {
    			data[i]["SITETYPE"] = "2";
    		}
    		if (data[i]["SITETYPE"] == "B") {
    			data[i]["SITETYPE"] = "1";
    		}
    		if (data[i]["SITETYPE"] == "C") {
    			data[i]["SITETYPE"] = "3";
    		}
    	}
    }

    $scope.expandedsearch = false; /* this variable decides wether extra research options are visible or not */

    $ionicModal.fromTemplateUrl('templates/modals/infolist.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_InfoList = modal;
    });

    $scope.openInfoListModal = function() {
        $scope.modal_InfoList.show();
    }

    $scope.closeInfoListModal = function() {
        $scope.modal_InfoList.hide();
    }

    $scope.expandSearch = function() {
        $scope.expandedsearch = true;
    }

    $scope.minifySearch = function() {
        $scope.expandedsearch = false;
    }

    $scope.clearSearch = function() {
        $scope.searchText = "";
    }

    $scope.clearFilter = function() {
        $scope.selectedCountry = 0;
    }
})



/*
 * Site Menu
 * ----------------------------------------------------------------------
 */
.controller('SiteMenuCtrl', function($scope) {
    $scope.sitemenu = {};
    $scope.sitemenu.id = '0'; /* This is used to set menu links to the right id. It's overwritten by children */
    $scope.sitemenu.section = 0; /* This is used to highlight current menu part. It's overwritten by children */
    $scope.siteMenuCtrl = {
        first: true
    };
})


/*
 * Site Pics controller
 * ----------------------------------------------------------------------
 */
.controller('SitePicsCtrl', function($scope, n2serv, $stateParams, $ionicLoading, $ionicHistory, $filter, CONFIG, SERVER) {

    var entryViewId = _.find($ionicHistory.viewHistory().views, {url : "/app/list"});
    if(entryViewId) {  
    	  $ionicHistory.backView(entryViewId);
    }
    
    //if ($scope.siteMenuCtrl.first) {
    //    $scope.siteMenuCtrl.first = false;
    //} else {
    //    $ionicHistory.removeBackView();
    //}

    var site = n2serv.getSiteById($stateParams.siteId);
    $scope.main.title = site.SITENAME;
    var $translateWord = $filter('translate');
    $ionicLoading.show({ template: $translateWord('RTPC') + '...' });
    //n2serv.getSitePics(site.LONGITUDE, site.LATITUDE).then(function(answer) {
    
	if ($scope.main.connected) {
		n2serv.getSitePicsById($stateParams.siteId).then(function(answer) {
        	$scope.pics = answer;
    	});
	    $ionicLoading.hide();
	} else {
		if ($scope.selectedLanguage.language.idL == "en") $scope.pics = [CONFIG.nocon_en];
		if ($scope.selectedLanguage.language.idL == "it") $scope.pics = [CONFIG.nocon_it];
		if ($scope.selectedLanguage.language.idL == "de") $scope.pics = [CONFIG.nocon_de];
		if ($scope.selectedLanguage.language.idL == "fr") $scope.pics = [CONFIG.nocon_fr];
		if ($scope.selectedLanguage.language.idL == "hu") $scope.pics = [CONFIG.nocon_hu];
		if ($scope.selectedLanguage.language.idL == "ro") $scope.pics = [CONFIG.nocon_ro];
	    $ionicLoading.hide();
    }
   	//$scope.allPics = answer;
    //var shuffled = $scope.allPics.sort(function() { return .5 - Math.random() });// shuffle  
    //$scope.pics = shuffled.slice(0, 3);

    $scope.sitemenu.section = 4;
    $scope.sitemenu.id = $stateParams.siteId;
    $scope.no_picture = CONFIG.nopic;

})


.controller('SiteInfoCtrl', function($scope, n2serv, $stateParams, $ionicHistory, $filter) {

    var entryViewId = _.find($ionicHistory.viewHistory().views, {url : "/app/list"});
    if(entryViewId) {  
    	  $ionicHistory.backView(entryViewId);
    }
    
    //if ($scope.siteMenuCtrl.first) {
    //    $scope.siteMenuCtrl.first = false;
    //} else {
    //    $ionicHistory.removeBackView();
    //}

    $scope.sitemenu.section = 1;
    $scope.sitemenu.id = $stateParams.siteId;

    var site = n2serv.getSiteById($stateParams.siteId);
    $scope.main.title = site.SITENAME;

    /* i have to retrieve extended region and country names */
    site.country_ext = n2serv.getCountryById(site.CTRY_CODE);
    site.overall = 0;
    //n2serv.getOverallFeedback(site.LONGITUDE, site.LATITUDE).then(function(answer) {
    n2serv.getOverallFeedbackById($stateParams.siteId).then(function(answer) {
        console.log('Overall feedback (retrieved from API): ' + JSON.stringify(answer));
        site.overall = answer;
    });

    console.log(site);
    $scope.info = site;

})



.controller('SiteFeedbackCtrl', function($scope, n2serv, $stateParams, $ionicHistory, $filter) {

    var entryViewId = _.find($ionicHistory.viewHistory().views, {url : "/app/list"});
    if(entryViewId) {  
    	  $ionicHistory.backView(entryViewId);
    }
    
    //if ($scope.siteMenuCtrl.first) {
    //    $scope.siteMenuCtrl.first = false;
    //} else {
    //    $ionicHistory.removeBackView();
    //}

    $scope.sitemenu.section = 5;
    $scope.sitemenu.id = $stateParams.siteId;
    $scope.loading = true;

    var site = n2serv.getSiteById($stateParams.siteId);
    $scope.main.title = site.SITENAME;

    console.log("SITE ID: " + $stateParams.siteId);
    //n2serv.getFeedbacks(site.LONGITUDE, site.LATITUDE).then(function(answer) {
    n2serv.getFeedbacksById($stateParams.siteId).then(function(answer) {
        $scope.loading = false;
        console.log('Feedback (retrieved from API): ' + JSON.stringify(answer));
        $scope.feedbacks = answer;
    	$scope.totalFeedbacks = $scope.feedbacks[0].total;
    });

    $scope.main.startinglat = Number(site.SLAT);
    $scope.main.startinglong = Number(site.SLON);
    $scope.main.sitepos = true;

})

.controller('SiteMapCtrl', function($scope, n2serv, $stateParams, $cordovaGeolocation, leafletBoundsHelpers, $timeout, $ionicModal, $ionicHistory, $ionicLoading, $filter, $state) {

    var entryViewId = _.find($ionicHistory.viewHistory().views, {url : "/app/list"});
    if(entryViewId) {  
    	  $ionicHistory.backView(entryViewId);
    }
    
    //if ($scope.siteMenuCtrl.first) {
    //    $scope.siteMenuCtrl.first = false;
    //} else {
    //    $ionicHistory.removeBackView();
    //}

    $scope.bar.barfix = ionic.Platform.isIOS();
    $scope.$apply;

    $scope.$on('leafletDirectiveMap.sitemap.dragend', function(event) {
        $scope.centeredIn = true;
        $scope.bar.barfix = false;
        console.log("barfix is " + $scope.bar.barfix);
        $scope.$apply;
    });

    $scope.sitemenu.section = 2;
    $scope.sitemenu.id = $stateParams.siteId;

    var site = n2serv.getSiteById($stateParams.siteId);
    console.log('Site retrieved');
    console.log(site);
    $scope.main.title = site.SITENAME;

    $scope.centerCurrentPositions = function() {
    	$scope.center.lat = Number(site.LAT);
    	$scope.center.lng = Number(site.LON);
        $scope.centeredIn = false;

        $scope.refreshMapSize('sitemap');
        $scope.$apply();
    }

    var $translateWord = $filter('translate');
    $scope.layers = {
        baselayers: {
            osm: {
                name: $translateWord('STRM'),
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                type: 'xyz',
                visible: true
            }
        },
        overlays: {

            nat2000: {
                name: $translateWord('PRST'),
                type: "wms", //agsDynamic
                url: "https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WmsServer",
                visible: true,
                layerParams: {
                	format: 'image/png', 
                	opacity: 0.7,
                    layers: [1,2],
                    version: '1.1.1',
                    transparent: true
                }
            },
	        europe: {
	            name: $translateWord('SATV'),
	            url: 'https://cidportal.jrc.ec.europa.eu/copernicus/services/tile/gmaps/core003_feathering_mixed@g/{z}/{x}/{y}.png',
	            type: 'xyz',
	            visible: false
	        }
        }
    }

    //n2serv.getMarkersBySite(site.LONGITUDE, site.LATITUDE).then(function(answer) {
    n2serv.getMarkersBySiteId($stateParams.siteId).then(function(answer) {
        console.log('Markers (retrieved from API): ');
        console.log(answer);
        $scope.marker=answer;
     });
      
    var latA = site.BBOX[0][0];
    var longA = site.BBOX[0][1];
    var latB = site.BBOX[1][0];
    var longB = site.BBOX[1][1];
    var site_bbox = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[ [latA, longA], [latB, longA], [latB, longB], [latA, longB], [latA, longA] ]]}}
    
    var bbWidth = Math.abs(latA - latB);
    var bbHeight = Math.abs(longA - longB);
    var zoomBBox = 9;
    if (bbWidth >= bbHeight) {
        if (bbWidth < 0.6000) {
        	  zoomBBox = 8.5;
          }
          if (bbWidth < 0.3000) {
        	  zoomBBox = 9.5;
          }
          if (bbWidth < 0.1200) {
        	  zoomBBox = 11.5;
          }
          if (bbWidth < 0.0700) {
        	  zoomBBox = 12.5;
          }
          if (bbWidth < 0.0350) {
        	  zoomBBox = 13.5;
          }
          if (bbWidth < 0.0150) {
        	  zoomBBox = 14.5;
          }
    } else {
        if (bbHeight < 0.6000) {
      	  zoomBBox = 9.5;
        }
        if (bbHeight < 0.3000) {
      	  zoomBBox = 10.5;
        }
        if (bbHeight < 0.1200) {
      	  zoomBBox = 11.5;
        }
        if (bbHeight < 0.0700) {
      	  zoomBBox = 13.5;
        }
        if (bbHeight < 0.0350) {
      	  zoomBBox = 14.5;
        }
        if (bbHeight < 0.0150) {
      	  zoomBBox = 15.5;
        }
    }
    console.log("WIDTH:" + bbWidth);
    console.log("HEIGHT:" + bbHeight);
    console.log("ZOOM:" + zoomBBox);
    angular.extend($scope, {
          marker:{},
          defaults: {
              doubleClickZoom: true,
              scrollWheelZoom: true,
              attributionControl: false,
              zoomControl: false
  		},
          geojson: {
              data: site_bbox,
              style: {
                  fillColor: "red",
                  weight: 2,
                  opacity: 1,
                  color: 'white',
                  dashArray: '3',
                  fillOpacity: 0.3
              }
          },
          center: {
              lat: Number(site.LAT),
              lng: Number(site.LON),
              zoom: zoomBBox
          }
      });
    
    /*
    var vertexNW = new L.LatLng(latA, longA),
    vertexSE = new L.LatLng(latB, longB),
    bounds = new L.LatLngBounds(vertexNW, vertexSE);
    if ($scope.main.currentMap == null) {
        console.log("Try to get map view reference");
    	$scope.main.currentMap = L.map('site-map2', {zoomControl: false}).setView([Number(site.LAT), Number(site.LON)], zoomBBox);
        console.log("Get map view reference");
    }
    console.log("Try to set bounds to fit in the map");
    $scope.main.currentMap.fitBounds(bounds, {padding: [50, 50]});
    console.log("Set bounds to fit in the map");
    */

    /* creates the feedback modal */
    $ionicModal.fromTemplateUrl('templates/modals/feedbackdetails_nomap.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_FeedbackDetail = modal;
    });

    $ionicModal.fromTemplateUrl('templates/modals/contributiondetails_nomap.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_ContributionDetail = modal;
    });

    $scope.closeFeedbackDetailModal = function() {
        $scope.modal_FeedbackDetail.hide();
    }

    $scope.closeContrDetailModal = function() {
        $scope.modal_ContributionDetail.hide();
    }
    
    $scope.checkCurrIndex = function(op) {
    	console.log(op);
    	if (op == "+") {
    		$scope.currIndex = $scope.currIndex + 1;
    		if ($scope.currIndex == $scope.selectedfeedback.properties.Image.length) $scope.currIndex = $scope.currIndex - 1; 
    	}
    	if (op == "-") {
    		if ($scope.currIndex > 0) $scope.currIndex = $scope.currIndex- 1;
    	}
    	console.log($scope.currIndex);
    }


    function findElement(arr, propName, propValue) {
    	for (var i=0; i < arr.length; i++)
    		if (arr[i][propName] == propValue)
    	      return arr[i];
    	// will return undefined if not found; you could return a default instead
    }

    $scope.linkToSiteMap = function(siteCode) {
        console.log("####################");
    	console.log("SiteID: " + siteCode);
        console.log("####################");
    	if ($scope.selectedfeedback.type == 0) $scope.modal_FeedbackDetail.hide();
        if ($scope.selectedfeedback.type == 1) $scope.modal_ContributionDetail.hide();
    	$state.go('app.site.info', { siteId : siteCode });
    }

    /* on click on a marker, shows the modal */
    $scope.$on('leafletDirectiveMarker.sitemap.click', function(e, args) {
        if (args.model.id) {
            $ionicLoading.show({ template: $translateWord('LDNG') + '...' });

            n2serv.getFeedbackById(args.model.id).then(function(answer) {
                $ionicLoading.hide();
                $scope.selectedfeedback = answer.data;
                $scope.sitesNameList = [];
                for (var h=0; h < $scope.selectedfeedback.properties.Code.length; h++) {
                    var x = findElement(sites, "SITECODE", $scope.selectedfeedback.properties.Code[h]);
                    if (typeof(x) != "undefined") {
                    	var sitesList = { name: x["SITENAME"], code: x["SITECODE"] };
                    	$scope.sitesNameList.push(sitesList);
                    }
                }

                if ($scope.selectedfeedback.type == '0') {
                    $scope.modal_FeedbackDetail.show();
                } else {
                	$scope.imagePreview = new Array();
                	$scope.imagePreview.push($scope.selectedfeedback.properties.Image[0]);
                	$scope.currIndex = 0;

                    $scope.modal_ContributionDetail.show();
                }
            }, function(answer) {
                $ionicLoading.show({ template: $translateWord('CNTE'), duration: 3000 });
            });


        }
    });
})

/*
 * Report choice called in a site
 * ----------------------------------------------------------------------
 */

.controller('SiteReportCtrl', function($scope, n2serv, $stateParams, $filter, $ionicHistory) {

    var entryViewId = _.find($ionicHistory.viewHistory().views, {url : "/app/list"});
    if(entryViewId) {  
    	  $ionicHistory.backView(entryViewId);
    }
    
    //if ($scope.siteMenuCtrl.first) {
    //    $scope.siteMenuCtrl.first = false;
    //} else {
    //    $ionicHistory.removeBackView();
    //}

    $scope.sitemenu.section = 3;
    $scope.sitemenu.id = $stateParams.siteId;

    var site = n2serv.getSiteById($stateParams.siteId);
    $scope.main.title = site.SITENAME;
    //$scope.main.startinglat = Number(site.SLAT) + (0.05 - (Math.random() / 10));
    //$scope.main.startinglong = Number(site.SLON) + (0.05 - (Math.random() / 10));
    $scope.main.startinglat = Number(site.SLAT);
    $scope.main.startinglong = Number(site.SLON);
    $scope.main.sitepos = true;
})



/*
 * Report choice called from main menu
 * ----------------------------------------------------------------------
 */
.controller('ReportCtrl', function($scope, $filter) {
    var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('RPTT');
    $scope.main.startinglat = $scope.main.lat;
    $scope.main.startinglong = $scope.main.lng;
    $scope.main.sitepos = false;
})

/*
 * Report observation
 * ----------------------------------------------------------------------
 */
.controller('ReportObservationCtrl', function($scope, $stateParams, $filter, $cordovaCamera, $ionicPlatform, $ionicModal, $cordovaGeolocation, $cordovaSQLite, $timeout, n2db, $state, $q, $ionicLoading, $ionicPopup, leafletData, $interval, $rootScope) {

    $scope.main.moved = false;
    angular.extend($scope, {
        tiles: {
            //url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png?=1'
            url: 'https://webtools.ec.europa.eu/road-maps/tiles/{z}/{x}/{y}.png'
        },
        center: {
            lat: $scope.main.startinglat,
            lng: $scope.main.startinglong,
            zoom: 12
        },
        center2:{
          lat: $scope.main.startinglat,
          lng: $scope.main.startinglong,
          zoom: 12
        },
        defaults: {
          dragging: false,
          doubleClickZoom: false,
          touchZoom: false
        }
    });
    if (($scope.main.startinglat != 50.102223) && ($scope.main.startinglong != 9.254419)) {
        $scope.main.moved = true;
        $scope.center2.zoom = 16;
    }



    $ionicPlatform.ready(function() {

        var id = $stateParams.repId;
        var type = $stateParams.type;
        if (typeof($stateParams.vote) != "undefined") {
            var vote = $stateParams.vote;
        } else {
            var vote = "0";
        }

        /* create new data for ng-model */
        var d = new Date();
        $scope.model = {};
        $scope.model.type = type;
        $scope.model.feedback = '0';
        $scope.model.id = d.getTime();
        $scope.model.lat = 50.102223;
        $scope.model.long = 9.254419;
        $scope.model.date = new Date();
        $scope.model.comment = '';
        $scope.model.pictures = new Array();
        $scope.model.picturetype = '1';
        $scope.model.anonymous = 'false';
        
        $scope.model.feedback = vote;
        
        console.log('id: ' + id + ' type:' + type);
        var $translateWord = $filter('translate');
        if (type == 0) {
            $scope.main.title = $translateWord('RPOB');
            $scope.main.sentReportType = "1";
        } else {
            $scope.main.title = $translateWord('RPFB');
            $scope.main.sentReportType = "0";
        }

        $scope.id = id;
        $scope.type = type;

        $scope.layers = {
        	baselayers: {
        		osm: {
        			name: $translateWord('STRM'),
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    type: 'xyz',
                    visible: true
        		}
        	},
            overlays: {
            	nat2000: {
            		name: $translateWord('PRST'),
                    type: "wms", //agsDynamic
                    url: "https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WmsServer",
                    visible: true,
                    layerParams: {
                    	format: 'image/png', 
                        opacity: 0.1,
                        layers: [1,2],
                        version: '1.1.1',
                        transparent: true
                    }
                }
            }
        }

        /* If called with 'new' as id I generate data for an empty form, else I open stored data */
        $scope.refreshPos = function() {

            if ($scope.main.sitepos === true) {
                $scope.model.lat = $scope.main.startinglat;
                $scope.model.long = $scope.main.startinglong;
                console.log('site:');
                $scope.center.lat = $scope.main.startinglat;
                $scope.center.lng = $scope.main.startinglong;
                $scope.center.zoom = 12;
            } else {
                if ($scope.main.gotpos === true) {
                    $scope.model.lat = $scope.main.lat;
                    $scope.model.long = $scope.main.lng;
                    console.log('real:');
                    $scope.center.lat = $scope.main.lat;
                    $scope.center.lng = $scope.main.lng;
                    $scope.center.zoom = 12;
                } else {
                    $scope.model.lat = 50.102223;
                    $scope.model.long = 9.254419;
                    console.log('fake:');
                    $scope.center.lat = 50.102223;
                    $scope.center.lng = 9.254419;
                    $scope.center.zoom = 12;
                }
            }


            console.log($scope.center);
        }


        $scope.maprefresh = function() {
            $scope.center.lat = $scope.model.lat;
            $scope.center.lng = $scope.model.long;
        }

        if (id == 'new') {

            $scope.refreshPos();

        } else {
            /* open stored data */
            $scope.main.gotpos = true
            n2db.getReportData(id).then(function(data) {
                // data or false
                $scope.model = data;
                $scope.model.picturetype = $scope.model.picturetype.toString();            
                $scope.center.lat = $scope.model.lat;
                $scope.center.lng = $scope.model.long;
                $scope.center.zoom = 12;
                $scope.refreshMapSize('latlongmap');
            }, function(err) {
                // if failing
                //console.log(err)
            });

            n2db.getReportPictures(id).then(function(data) {
                // data or false
                if (data) {
                    $scope.model.pictures = data.pictures;
                    //console.log('Using pictures retrieved');
                } else {
                    $scope.model.pictures = new Array();
                    //console.log('Using empty pictures array');
                }

            }, function(err) {
                // if failing
                //console.log(err)
                $scope.model.pictures = new Array();
            });
        }


        /* Adding pictures by camera or library */
        var options = {
            quality: 75,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            allowEdit: true, //false?????
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 600,
            targetHeight: 600,
            popoverOptions: CameraPopoverOptions,
            //saveToPhotoAlbum: false,
            saveToPhotoAlbum: true
        };

        /* will build different buttons for adding picture from library or taking picture. Passing a parameter will change the options */
        $scope.addnewpicture = function(picsrc) {
            var d = new Date();
            var key = d.getTime();

            if (picsrc == 1) { /* parameter 1 means using camera */
                options.sourceType = Camera.PictureSourceType.CAMERA;
            } else {
                options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            }

            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.model.pictures.push("data:image/jpeg;base64," + imageData);
            });

        }

        $scope.removepic = function(key) {
            $scope.model.pictures.splice(key, 1);
        }


        $ionicModal.fromTemplateUrl('templates/modals/saved.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal_saved = modal;
        });

        $scope.closemodalsaved = function() {
            $scope.modal_saved.hide();
        }

        $scope.forceshowmap = false;
        $scope.selectfrommap = function() {
            $scope.forceshowmap = true;
            //$scope.bigmap.show(); //it doesn't refresh the model the first time it gets called idk why
            $scope.openBigMap();
        }


        $ionicModal.fromTemplateUrl('templates/modals/selectpos.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.bigmap = modal;
        });

        $scope.$on('modal.hidden', function() {
          // Execute action
          $scope.center.lat = $scope.center2.lat;
          $scope.center.lng = $scope.center2.lng;
          $scope.model.lat = $scope.center2.lat;
          $scope.model.long = $scope.center2.lng;
        });

        $scope.closeBigMap = function() {
            $scope.bigmap.hide();
            $scope.center.lat = $scope.center2.lat;
            $scope.center.lng = $scope.center2.lng;
            $scope.refreshMapSize('latlongmap');
            $scope.main.moved = true;
            $scope.$apply();
        }

        $scope.openBigMap = function() {
        	if ($scope.main.gotpos === true) {
        		if ($scope.main.moved == false) {
	                $scope.center.lat = $scope.center.lat;
	                $scope.center.lng = $scope.center.lng;
	                $scope.center2.lat = $scope.center.lat;
	                $scope.center2.lng = $scope.center.lng;
        		}
        	} else {
        		if ($scope.main.moved == false) {
            		$scope.center.lat = 50.102223;
            		$scope.center.lng = 9.254419;
            		$scope.center2.lat = 50.102223;
            		$scope.center2.lng = 9.254419;
        		}
        	}
            $scope.bigmap.show();
            $scope.refreshMapSize('latlongbigmap');
        }

        $scope.refreshMapSize = function(map){
          leafletData.getMap(map).then(function(map) {
            //map.invalidateSize();
            if (map.getContainer().style.width == '100%'){
              map.getContainer().style.width = '99%';
            }else{
              map.getContainer().style.width = '100%';
            }
            
            $interval(function() {
                map.invalidateSize();
              }, 700, 1);
          });
        }



        /* retrieving geoposition */
        $scope.centerCurrentPositions = function() {

          $scope.center.lat = $scope.main.lat;
          $scope.center.lng = $scope.main.lng;
          $scope.center2.lat = $scope.main.lat;
          $scope.center2.lng = $scope.main.lng;
          $scope.model.lat = $scope.main.lat;
          $scope.model.long = $scope.main.lng;

          $scope.refreshMapSize('latlongmap');
          $scope.$apply();
         
        }

        
        /* Saves the draft in the DB */
        $scope.savedraft = function() {
                var $translateWord = $filter('translate');
                n2db.saveReport($scope.model).then(function(data) {
                    $scope.id = $scope.model.id; /* this changes the button on the top so you can now update your report */
                    $scope.modalmessage = $translateWord('SVDD');
                    $scope.modalbutton = false;
                    $scope.modal_saved.show();
                });
            }
            /* end saving draft function */

        /* Updates the draft in the DB */
        $scope.updatedraft = function() {
            var $translateWord = $filter('translate');
            n2db.updateReport($scope.model).then(function(data) {
                $scope.modalmessage = $translateWord('UPDD');
                $scope.modalbutton = false;
                $scope.modal_saved.show();
            });
        }
        /* end update draft function */

        /* SEND */
        $scope.send = function() {
            if ($scope.id == 'new') {
                n2db.saveReport($scope.model).then(function(data) {
                    $scope.id = $scope.model.id; /* this changes the button on the top so you can now update your report */
                    $scope.send_2();
                });
            } else {
                n2db.updateReport($scope.model).then(function(data) {
                    $scope.send_2();
                });
            }
        }

        $scope.send_2 = function() {
            var $translateWord = $filter('translate');
            if ($scope.main.user.ICCID == '') {
                var myPopup = $ionicPopup.show({
                    template: $translateWord('SDLI'),
                    title: $translateWord('LGINTLT'),
                    scope: $scope,
                    buttons: [
                        { text: $translateWord('CNCL') }, {
                            text: '<b>' + $translateWord('LGIN') + '</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                $state.go('app.login');
                            }
                        }
                    ]
                });
            } else {
                $scope.modalmessage = $translateWord('SVSP');
                $scope.modalbutton = true;
                $scope.modal_saved.show();
            }
        }

        $scope.send_3 = function() {
            var $translateWord = $filter('translate');
            $scope.modal_saved.hide().then(function() {
                $ionicLoading.show({ template: $translateWord('LDNG') + "..." });
                if ($scope.main.connected) {
	                n2db.sendReport($scope.id, $scope.main.user).then(function(data) {
	                    $ionicLoading.hide();
	                    $scope.main.onsave = true;
	                    $state.go('app.mysentreports');
	                }, function(data) {
	                    $ionicLoading.hide();
	                    //console.log('Report not sent');
	                    console.log("OUTPUT:" + data);
	                    if (data != false) {
		                    if (data.data.message.substring(0,10) == "JUST_VOTED") {
		                        $scope.modalmessage = $translateWord('JSTVTD');
		                    } else {
		                        $scope.modalmessage = $translateWord('RPNS');
		                    }
	                    } else {
	                        $scope.modalmessage = $translateWord('RPNS');
	                    }
	                    $scope.modalbutton = false;
	                    $scope.modal_saved.show();
	                });
                } else {
                    $ionicLoading.hide();
                    var myPopup = $ionicPopup.show({
                        template: $translateWord('OFFLINE'),
                        title: $translateWord('CNTE'),
                        scope: $scope,
                        buttons: [
                            { text: $translateWord('KEPK'),
                            	onTap: function(e) {
                                    $state.go('app.myreports');
                                }
                            }
                        ]
                    });
                }
            });
        }

        $scope.managedrafts = function() {
            $scope.modal_saved.hide().then(function() {
            	$state.go('app.myreports');
            });
        }
    })

})



/*
 * User's reports page
 * ----------------------------------------------------------------------
 */
.controller('MyReportsCtrl', function($scope, $ionicModal, $ionicPlatform, n2db, $q, $state, $ionicLoading, $ionicPopup, $ionicHistory, $filter, $rootScope, $stateParams) {
    var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('MYRP');
    $scope.found = 0;
    $scope.showfilter = "0";
    $scope.itemtodelete = false;
    $scope.processing = false;
    
	$scope.main.pagingStart = 1; 
	$scope.main.pagingEnd = 20;
	$scope.main.userReports = 0;


    console.log('back');
    console.log($ionicHistory.backView());

    if ($ionicHistory.backView().stateId == "app.mysentreports") {
        $ionicHistory.removeBackView();
    }

    $ionicPlatform.ready(function() {
        $scope.updatefromdb = function() {
            console.log('update from db called');
            $scope.found = 0;
            n2db.getReports().then(function(data) {
                $scope.results = data;

                if ($scope.results.length > 0) {
                    $scope.found = 1;
                    console.log('got results');
                } else {
                    $scope.found = 2;
                    console.log('no results');
                }

                /* Those are used to close the modal when invoked after a delete */
                $scope.modal_delete.hide();
                $scope.processing = false;
                $ionicLoading.hide();

            }, function(err) {
                $scope.modal_delete.hide();
                $scope.found = 2;
                $ionicLoading.hide();
            });
        }

        setTimeout(function() {
            //console.log('Launching the FIRST request to the db service');
            $scope.updatefromdb();
        }, 2000);


        $ionicModal.fromTemplateUrl('templates/modals/delete.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal_delete = modal;
        });

        $scope.deletedraft = function(itemtodelete) {
            $scope.itemtodelete = itemtodelete;
            $scope.modal_delete.show();
        }

        $scope.closemodaldelete = function() {
            $scope.itemtodelete = false;
            $scope.modal_delete.hide();
            $scope.processing = false;
        }

        $scope.confirmdelete = function() {
            $ionicLoading.show({ template: $translateWord('LDNG') + "..." });
            n2db.deleteReport($scope.itemtodelete).then(function() {
                $scope.updatefromdb();
            });
        }


        $ionicModal.fromTemplateUrl('templates/modals/saved.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal_saved = modal;
        });

        $scope.closemodalsaved = function() {
            $scope.modal_saved.hide();
        }

        $scope.send_single = function(id, type) {
            if ($scope.main.user.ICCID == '') {
                var myPopup = $ionicPopup.show({
                    template: $translateWord('NLGN'),
                    title: $translateWord('LGINTLT'),
                    scope: $scope,
                    buttons: [
                        { text: $translateWord('CNCL') }, {
                            text: '<b>' + $translateWord('LGIN') + '</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                $state.go('app.login');
                            }
                        }
                    ]
                });
            } else {
            	if (type == 1) $scope.main.sentReportType = "0";  // type used in the app is 1 for feedback and 0 for observation
            	if (type == 0) $scope.main.sentReportType = "1";  // type used in MongoDB is 1 for observation and 0 for feedback
            	
                $scope.modalmessage = $translateWord('PBNL');
                $scope.itemtopublish = id;
                $scope.publishall = false;
                $scope.modalbutton = true;
                $scope.modal_saved.show();
            }
        }

        $scope.sendall = function() {
            if ($scope.main.user.ICCID == '') {
                var myPopup = $ionicPopup.show({
                    template: $translateWord('NLGN'),
                    title: $translateWord('LGINTLT'),
                    scope: $scope,
                    buttons: [
                        { text: $translateWord('CNCL') }, {
                            text: '<b>' + $translateWord('LGIN') + '</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                $state.go('app.login');
                            }
                        }
                    ]
                });
            } else {
                $scope.modalmessage = $translateWord('PBDR');
                $scope.publishall = true;
                $scope.modalbutton = true;
                $scope.modal_saved.show();
            }
        }

        $scope.managedrafts = function() {

            //$scope.modal_saved.hide();
            $scope.modal_saved.hide().then(function() {
                console.log("Move to Draft Reports");
            	$state.go('app.myreports');
                //$state.reload();
            	  var current = $state.current;
              	  var params = angular.copy($stateParams);
              	  $rootScope.$emit('reloading');
              	  console.log("Trying to refresh page");
              	  $state.transitionTo(current, params, { reload: true, inherit: true, notify: true });

            });
        }

        $scope.send_3 = function() {
            console.log('function send_3 called');
            $scope.modal_saved.hide().then(function() {
                $ionicLoading.show({ template: $translateWord('LDNG') + "..." });
                if ($scope.publishall == false) {
                    /* sends a single report */
                	if ($scope.main.connected) {
	                	n2db.sendReport($scope.itemtopublish, $scope.main.user).then(function(data) {
	                        $ionicLoading.hide();
	                        console.log('Report sent');
	                        $scope.main.onsave = true;
	                        $state.go('app.mysentreports');
	                    }, function(data) {
	                        $ionicLoading.hide();
	                        console.log('Report not sent');
	                        if (data.data.message.substring(0,10) == "JUST_VOTED") {
	                            $scope.modalmessage = $translateWord('JSTVTD');
	                        } else {
	                            $scope.modalmessage = $translateWord('RPNS');
	                        }
	                        $scope.modalbutton = false;
	                        $scope.modal_saved.show();
	                    });
                	} else {
                        $ionicLoading.hide();
                        var myPopup = $ionicPopup.show({
                            template: $translateWord('OFFLINE'),
                            title: $translateWord('CNTE'),
                            scope: $scope,
                            buttons: [
                                { text: $translateWord('KEPK'),
                                	onTap: function(e) {
                                        $state.go('app.myreports');
                                    }
                                }
                            ]
                        });
                	}
                } else {
                    /* sends all reports */
                	if ($scope.main.connected) {
	                    n2db.sendAllReports($scope.main.user).then(function(data) {
	                        $ionicLoading.hide();
	                        $scope.main.onsave = true;
	                        $state.go('app.mysentreports');
	                    }, function(data) {
	                        //console.log('failure, status:' + data);
	                        $ionicLoading.hide();
	                        if (data == false) {
	                            /* incomplete drafts */
	                            $scope.updatefromdb();
	                            $scope.modalmessage = $translateWord('RPNSS');
	                        } else {
	                            /* no drafts */
	                            $scope.modalmessage = $translateWord('NSDR');
	                        }
	                        $scope.modalbutton = false;
	                        $scope.modal_saved.show();
	                    });
                	} else {
                        $ionicLoading.hide();
                        var myPopup = $ionicPopup.show({
                            template: $translateWord('OFFLINE'),
                            title: $translateWord('CNTE'),
                            scope: $scope,
                            buttons: [
                                { text: $translateWord('KEPK'),
                                	onTap: function(e) {
                                        $state.go('app.myreports');
                                    }
                                }
                            ]
                        });
                	}
                }
            });
        }
    });

})


/*
 * User's SENT reports page
 * ----------------------------------------------------------------------
 */

.controller('MySentReportsCtrl', function($scope, n2serv, $ionicModal, $ionicLoading, $ionicHistory, $filter, leafletData, $interval, $timeout, $state, $stateParams, $rootScope) {
    var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('MYRP');
    $scope.found = 0;
    $scope.showfilter = '0';
    $scope.statusfilter = '0';
    $scope.itemtodelete = false;
    $scope.processing = false;
    
    angular.extend($scope, {
        tiles: {
            //url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png?=1'
            url: 'https://webtools.ec.europa.eu/road-maps/tiles/{z}/{x}/{y}.png'
        },
        center: {
            lat: $scope.main.startinglat,
            lng: $scope.main.startinglong,
            zoom: 14
        },
        defaults: {
          dragging: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          attributionControl: false,
          zoomControl: true
        }
    });

    $scope.layers = {
    	baselayers: {
        	osm: {
        		name: $translateWord('STRM'),
                   url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                   type: 'xyz',
                   visible: true
        	}
        },
        overlays: {
          	nat2000: {
        		name: $translateWord('PRST'),
                type: "wms", //agsDynamic
                url: "https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WmsServer",
                visible: true,
                layerParams: {
                	format: 'image/png', 
                    opacity: 0.1,
                    layers: [1,2],
                    version: '1.1.1',
                    transparent: true
                }
            }
        }
    }

    $ionicLoading.show({ template: $translateWord('LDNG') + "..." });

    if ($ionicHistory.backView().stateId == "app.myreports") {
        $ionicHistory.removeBackView();
    }

    $scope.centerCurrentPositions = function() {
        $scope.center.lat = $scope.selectedfeedback.geometry.coordinates[1];
        $scope.center.lng = $scope.selectedfeedback.geometry.coordinates[0];
        $scope.centeredInObs = false;
        if ($scope.selectedfeedback.type == "1") $scope.refreshMapSize('observationmap');
        if ($scope.selectedfeedback.type == "0") $scope.refreshMapSize('feedbackmap');
        $scope.$apply();
    }

    $scope.$on('leafletDirectiveMap.observationmap.dragend', function(event) {
        $scope.centeredInObs = true;
    });

    $scope.$on('leafletDirectiveMap.observationmap.zoomend', function(event) {
        $scope.centeredInObs = true;
    });

    $scope.$on('leafletDirectiveMap.feedbackmap.dragend', function(event) {
        $scope.centeredInObs = true;
    });

    $scope.$on('leafletDirectiveMap.feedbackmap.zoomend', function(event) {
        $scope.centeredInObs = true;
    });

    $scope.refreshMapSize = function(map){
        leafletData.getMap(map).then(function(map) {
          //map.invalidateSize();
          if (map.getContainer().style.width == '100%'){
            map.getContainer().style.width = '99%';
          }else{
            map.getContainer().style.width = '100%';
          }
          
          $interval(function() {
              map.invalidateSize();
        	  //window.dispatchEvent(new Event('resize'));
            }, 700, 1);
        });
      }

    n2serv.getUserCountReports($scope.main.user.ECASuniqueID).then(function(answer) {
    	$scope.main.userReports = answer.data.count;
    	$scope.pages = Math.ceil($scope.main.userReports / 20);  
    });
    
    n2serv.getUserPagedReports($scope.main.user.ECASuniqueID, $scope.main.pagingStart, $scope.main.pagingEnd).then(function(answer) {
        $scope.results = answer;
        $ionicLoading.hide();
    });

    /* creates the feedback modal */
    $ionicModal.fromTemplateUrl('templates/modals/feedbackdetails.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_FeedbackDetail = modal;
    });

    $ionicModal.fromTemplateUrl('templates/modals/contributiondetails.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_ContributionDetail = modal;
    });

    $scope.closeFeedbackDetailModal = function() {
        $scope.modal_FeedbackDetail.hide();
    }

    $scope.closeContrDetailModal = function() {
        $scope.modal_ContributionDetail.hide();
    }
    
    $scope.linkToSiteMap = function(siteCode) {
        if ($scope.selectedfeedback.type == 0) $scope.modal_FeedbackDetail.hide();
        if ($scope.selectedfeedback.type == 1) $scope.modal_ContributionDetail.hide();
    	$state.go('app.site.info', { siteId : siteCode });
    }
    
    $scope.checkCurrIndex = function(op) {
    	console.log(op);
    	if (op == "+") {
    		$scope.currIndex = $scope.currIndex + 1;
    		if ($scope.currIndex == $scope.selectedfeedback.properties.Image.length) $scope.currIndex = $scope.currIndex - 1; 
    	}
    	if (op == "-") {
    		if ($scope.currIndex > 0) $scope.currIndex = $scope.currIndex- 1;
    	}
    	console.log($scope.currIndex);
    }
    
    
    function findElement(arr, propName, propValue) {
    	for (var i=0; i < arr.length; i++)
    		if (arr[i][propName] == propValue)
    	      return arr[i];
    	// will return undefined if not found; you could return a default instead
    }
    
    $scope.updateSpeciesPage = function(){
  	  var current = $state.current;
  	  var params = angular.copy($stateParams);
  	  $rootScope.$emit('reloading');
  	  return $state.transitionTo(current, params, { reload: true, inherit: true, notify: true });
    };

    $scope.increasePaging = function(value) {
    	if ($scope.pages > ($scope.main.pagingEnd/20)) {
        	$scope.main.pagingStart = $scope.main.pagingStart + value; 
        	$scope.main.pagingEnd = $scope.main.pagingEnd + value;
            n2serv.getUserPagedReports($scope.main.user.ECASuniqueID, $scope.main.pagingStart, $scope.main.pagingEnd).then(function(answer) {
                $scope.results = answer;
            });
    	}
    };
    
    $scope.decreasePaging = function(value) {
    	$scope.main.pagingStart = $scope.main.pagingStart - value; 
    	$scope.main.pagingEnd = $scope.main.pagingEnd - value;
    	if ($scope.main.pagingStart < 0) {
        	$scope.main.pagingStart = 1; 
        	$scope.main.pagingEnd = 20;
    	}
        n2serv.getUserPagedReports($scope.main.user.ECASuniqueID, $scope.main.pagingStart, $scope.main.pagingEnd).then(function(answer) {
            $scope.results = answer;
        });
    };

    $scope.clickdetails = function(type, id) {
    	console.log("TYPE: " + type);
    	console.log("ID: " + id);
    	if (type == 0) {
    		$scope.showfeedback(id);
    	} else {
    		$scope.showreport(id);
    	}
    };

    $scope.showfeedback = function(id) {
        $ionicLoading.show({ template: $translateWord('LDNG') + '...' });
        n2serv.getFeedbackById(id).then(function(answer) {
            $ionicLoading.hide();
            $scope.selectedfeedback = answer.data;
            $scope.sitesNameList = [];
            for (var h=0; h < $scope.selectedfeedback.properties.Code.length; h++) {
                var x = findElement(sites, "SITECODE", $scope.selectedfeedback.properties.Code[h]);
                if (typeof(x) != "undefined") {
                	var sitesList = { name: x["SITENAME"], code: x["SITECODE"] };
                	$scope.sitesNameList.push(sitesList);
                }
            }
            $scope.center.lat = $scope.selectedfeedback.geometry.coordinates[1];
            $scope.center.lng = $scope.selectedfeedback.geometry.coordinates[0];
            $scope.center.zoom = 14;
            $scope.markers = new Array();
            $timeout(function() {
            	$scope.markers.push({
            		lat: $scope.selectedfeedback.geometry.coordinates[1],
                    lng: $scope.selectedfeedback.geometry.coordinates[0],
	        		icon: {
	        			iconUrl: 'img/point.svg',
	                    iconSize: [20, 20],
	                    iconAnchor: [10, 10]
	                }
            	});
            	console.log($scope.markers[0].lat);
            	console.log($scope.markers[0].lng);
            });
 
            $scope.refreshMapSize('feedbackmap');
            $scope.modal_FeedbackDetail.show();
            $scope.centeredInObs = false;
        }, function(error) {
            $ionicLoading.hide();
            $ionicLoading.show({ template: $translateWord('CNTE'), duration: 3000 });
        });
    }

    $scope.showreport = function(id) {
        $ionicLoading.show({ template: $translateWord('LDNG') + '...' });
        n2serv.getFeedbackById(id).then(function(answer) {
            $ionicLoading.hide();
            $scope.selectedfeedback = answer.data;
            $scope.sitesNameList = [];
            for (var h=0; h < $scope.selectedfeedback.properties.Code.length; h++) {
                var x = findElement(sites, "SITECODE", $scope.selectedfeedback.properties.Code[h]);
                if (typeof(x) != "undefined") {
                	var sitesList = { name: x["SITENAME"], code: x["SITECODE"] };
                	$scope.sitesNameList.push(sitesList);
                }
            }
            $scope.center.lat = $scope.selectedfeedback.geometry.coordinates[1];
            $scope.center.lng = $scope.selectedfeedback.geometry.coordinates[0];
            $scope.center.zoom = 14;
            $scope.markers = new Array();
            $timeout(function() {
            	$scope.markers.push({
            		lat: $scope.selectedfeedback.geometry.coordinates[1],
                    lng: $scope.selectedfeedback.geometry.coordinates[0],
	        		icon: {
	        			iconUrl: 'img/pin.svg',
	                    iconSize: [40, 40],
	                    iconAnchor: [20, 40]
	                }
            	});
            	console.log($scope.markers[0].lat);
            	console.log($scope.markers[0].lng);

            	$scope.imagePreview = new Array();
            	$scope.imagePreview.push($scope.selectedfeedback.properties.Image[0]);
            	$scope.images = $scope.selectedfeedback.properties.Image;
            });
            $scope.refreshMapSize('observationmap');
            $scope.modal_ContributionDetail.show();
            $scope.centeredInObs = false;
        	$scope.currIndex = 0;
        }, function(error) {
            $ionicLoading.hide();
            $ionicLoading.show({ template: $translateWord('CNTE'), duration: 3000 });
        });
    }


    $scope.managedrafts = function() {
        $scope.modal_saved.hide();
    }



    if ($scope.main.onsave == true) {

        $ionicModal.fromTemplateUrl('templates/modals/saved.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal_saved = modal;
            //alert("-" + $scope.main.sentReportType + "-");
            if ($scope.main.sentReportType == "1") {
                $scope.modalmessage = $translateWord('ROPK');
            } else {
                $scope.modalmessage = $translateWord('ROPKF');
            }
            $scope.modalbutton = false;
            $scope.modal_saved.show();
            $scope.main.onsave = false;
        });

        $scope.closemodalsaved = function() {
            $scope.modal_saved.hide();
            $ionicHistory.removeBackView(); /* if I put it here it still gives an error but at least doesn't block the app */
        }


    }
    
	$scope.images = new Array();
	$scope.images[0] = "img/noimg2.svg"
	//$scope.speciesCtrl = {
	//	    activeIndex: 0
	//}
	//$scope.photoBrowser(0);
	$scope.currIndex = 0;




})




.controller('MapCtrl', function($scope, n2serv, $cordovaGeolocation, leafletBoundsHelpers, $timeout, $ionicModal, $ionicLoading, $filter, $ionicPlatform, leafletData, $interval) {

    if ($scope.main.gotpos === false) {
		$scope.main.lat = 50.102223;
		$scope.main.lng = 9.254419;
	}
    $scope.centeredIn = false;

    var you = {
        lat: $scope.main.lat,
        lng: $scope.main.lng,
        icon: {
            iconUrl: 'img/you.png',
            iconSize: [50, 50],
            iconAnchor: [10, 0],
            shadowSize: [0, 0]
        }
    };
    var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('STMP');

    angular.extend($scope, {
        defaults: {
            doubleClickZoom: true,
            scrollWheelZoom: true,
            attributionControl: false,
            zoomControl: false
        },
        center: {
            lat: $scope.main.lat,
            lng: $scope.main.lng,
            zoom: 12
        }
    });

$ionicPlatform.ready(function() {

    $scope.centerCurrentPositions = function() {
        $scope.center.lat = $scope.main.lat;
        $scope.center.lng = $scope.main.lng;
        $scope.centeredIn = false;

        $scope.refreshMapSize('site-map1');
        $scope.$apply();
    }

    $scope.refreshMapSize = function(map){
        leafletData.getMap(map).then(function(map) {
          //map.invalidateSize();
          if (map.getContainer().style.width == '100%'){
            map.getContainer().style.width = '99.5%';
          }else{
            map.getContainer().style.width = '100%';
          }
          
          $interval(function() {
              map.invalidateSize();
        	  //window.dispatchEvent(new Event('resize'));
            }, 700, 1);
        });
      }

    $scope.marker = {};

    $scope.$on('leafletDirectiveMap.site-map1.load', function(event) {
        $scope.refreshMapSize("site-map1");
        $scope.centeredIn = false;
        console.log($scope.center.zoom);
    });

    $scope.$on('leafletDirectiveMap.site-map1.dragend', function(event) {
        $scope.createMarkers();
        $scope.centeredIn = true;
        console.log($scope.center.zoom);
    });

    $scope.$on('leafletDirectiveMap.site-map1.zoomend', function(event) {
        $scope.createMarkers();
        $scope.centeredIn = true;
        console.log($scope.center.zoom);
    });

    $scope.createMarkers = function() {

        if ($scope.center.zoom >= 10) {
            $scope.marker = n2serv.getSiteMarkers($scope.center.lat, $scope.center.lng);
        } else {
            $scope.marker = {};
        }
        $scope.marker.yourpos = you;
        $scope.refreshMapSize("site-map1");
    }

    $scope.layers = {
        baselayers: {
            osm: {
                name: $translateWord('STRM'),
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                type: 'xyz'
            }
        },
        overlays: {

            nat2000: {
                name: $translateWord('PRST'),
                type: "wms", //agsDynamic
                url: "https://bio.discomap.eea.europa.eu/arcgis/services/ProtectedSites/Natura2000Sites/MapServer/WmsServer",
                visible: true,
                layerParams: {
                	format: 'image/png', 
                	opacity: 0.7,
                    layers: [1,2],
                    version: '1.1.1',
                    transparent: true
                }
            },
	        europe: {
	            name: $translateWord('SATV'),
	            url: 'https://cidportal.jrc.ec.europa.eu/copernicus/services/tile/gmaps/core003_feathering_mixed@g/{z}/{x}/{y}.png',
	            type: 'xyz',
	            visible: false
	        }
        }
    }



    //var firstime = 0;

    $scope.refreshPos = function() {
        $scope.createMarkers();
        if ($scope.main.gotpos === true) {

            console.log('Refresh pos: LAT ' + $scope.main.lat + " LONG " + $scope.main.lng);
            you = {
                lat: $scope.main.lat,
                lng: $scope.main.lng,
                icon: {
                    iconUrl: 'img/you.png',
                    iconSize: [50, 50],
                    iconAnchor: [10, 0],
                    shadowSize: [0, 0]
                }
            };

            $scope.marker.yourpos = you;

            if ($scope.main.firstime == 0) {
                /*
            	$scope.center = {
                    lat: $scope.main.lat,
                    lng: $scope.main.lng,
                    zoom: 12
                }
                $scope.$apply();
                $scope.createMarkers($scope.main.lat, $scope.main.lng);
                $scope.refreshMapSize("site-map1");
                $scope.centerCurrentPositions();
                */

            	$scope.main.firstime++;

                //$scope.center.lat = Number($scope.main.lat.toFixed(7));
                //$scope.center.lng = Number($scope.main.lng.toFixed(7));
                $scope.center.lat = $scope.main.lat;
                $scope.center.lng = $scope.main.lng;
                $scope.center.zoom = 12;

                $scope.createMarkers($scope.main.lat, $scope.main.lng);
            }
            $scope.refreshMapSize('site-map1');
            $scope.$apply();


        } else {

            console.log('Refresh pos: LAT ' + $scope.main.lat + " LONG " + $scope.main.lng);
            you = {
                lat: 50.102223,
                lng: 9.254419,
                icon: {
                    iconUrl: 'img/you.png',
                    iconSize: [50, 50],
                    iconAnchor: [10, 0],
                    shadowSize: [0, 0]
                }
            };

            $scope.marker.yourpos = you;

            if ($scope.main.firstime == 0) {

                /* no location */
                $ionicLoading.show({ template: $translateWord('NOLC'), duration: 2000 });
                $scope.center = {
                    lat: 50.102223,
                    lng: 9.254419,
                    zoom: 12
                }
                $scope.$apply();
                $scope.createMarkers($scope.main.lat, $scope.main.lng);
                $scope.main.firstime++;
                $scope.refreshMapSize("site-map1");
            }


        }
        
        $timeout(function() { $scope.refreshPos(); }, 4000);
        
        /* end refreshpos */
    }

    $timeout(function() { $scope.refreshPos(); }, 1500);
    
    /* Footer additionnal information */
    $scope.additionnalInfo = {
        visible: false,
        contentSelected: false,
        selectedStation: null,
        markerSelected: null,
        selectedSite: ""
    };


    /* creates the feedback modal */
    $ionicModal.fromTemplateUrl('templates/modals/sitedetail.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal_SiteDetail = modal;
    });


    $scope.closeSiteDetailModal = function() {
        $scope.modal_SiteDetail.hide();
    }


    /* on click on a marker, shows the modal */
    $scope.$on('leafletDirectiveMarker.site-map1.click', function(e, args) {
        if (args.model.id) { /* if I don't check, marker indicating user position will be visible */
            /* gets feedback data */
            $scope.additionnalInfo.selectedSite = n2serv.getSiteById(args.model.id);
            $scope.additionnalInfo.visible = true;
            $scope.additionnalInfo.contentSelected = true;
        }

    });

    $scope.$on('leafletDirectiveMap.site-map1.click', function(e, args) {
        $scope.additionnalInfo.contentSelected = false;
        $scope.additionnalInfo.visible = false;
        $scope.additionnalInfo.selectedSite = "";
    });

});

    
})




/*
 * Login controller
 * ----------------------------------------------------------------------
 */
.controller('LogInCtrl', function($scope, $ionicPopup, n2serv, n2db, $ionicLoading, $http, $filter) {

	function ping(ip, callback) {

	    if (!this.inUse) {
	        this.status = 'unchecked';
	        this.inUse = true;
	        this.callback = callback;
	        this.ip = ip;
	        var _that = this;
	        this.img = new Image();
	        this.img.onload = function () {
	            _that.inUse = false;
	            _that.callback('responded');

	        };
	        this.img.onerror = function (e) {
	            if (_that.inUse) {
	                _that.inUse = false;
	                _that.callback('error', e);
	            }

	        };
	        this.start = new Date().getTime();
	        randomNum = new Date().valueOf();
	        this.img.src = ip + "?" + randomNum;
	        this.timer = setTimeout(function () {
	            if (_that.inUse) {
	                _that.inUse = false;
	                _that.callback('timeout');
	            }
	        }, 1500);
	    }
	}
	
	var $translateWord = $filter('translate');
    $scope.main.title = $translateWord('LGINTLT');

    $scope.logoutVar = '';

    $scope.registerECAS = function() {
    	new ping("https://webgate.ec.europa.eu/cas/images/favicon.ico", function (status, e) {
    		if (status != "responded") $scope.main.ping = false;
    		if (status == "responded") $scope.main.ping = true;
            console.log(status);
	    	if ($scope.main.connected && $scope.main.ping) {
	    		var ref = cordova.InAppBrowser.open('https://webgate.ec.europa.eu/cas/eim/external/register.cgi', '_blank', 'location=yes');
	    		ref.show();
	    	} else {
	            var myPopup = $ionicPopup.show({
	                template: $translateWord('OFFLINE'),
	                title: $translateWord('CNTE'),
	                scope: $scope,
	                buttons: [
	                    { text: $translateWord('KEPK') }
	                ]
	            });
	    	}
    	});
    };

    $scope.resetview = function() {

        if ($scope.main.user.ICCID != '') {
            $scope.loggedtxt = $translateWord('LIAS');
            $scope.logged = true;
        } else {
            $scope.loggedtxt = $translateWord('NLGN');
            $scope.logged = false;
        }
        
        $scope.main.iconLogged = "login_on.png"; 
        if ($scope.logged === false) $scope.main.iconLogged = "login_off.png";
        console.log("Logged: " + $scope.logged);
        console.log("Icon: " + $scope.main.iconLogged);
        
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

    $scope.resetview();

    $scope.logoff = function() {
        console.log('logoff');
        $scope.main.user.ICCID = '';
        $scope.main.user.ECASName = '';
        $scope.main.user.ECASmail = '';
        $scope.main.user.ECASuniqueID = '';
        $scope.logoutFromECAS();
        $scope.loggedmsg = $translateWord('LGUTK');
        n2db.userLogout();
        $scope.resetview();

    }




    ionic.Platform.ready(function() {

    	$scope.logoutFromECAS = function() {
            var ref = cordova.InAppBrowser.open('https://webgate.ec.europa.eu/cas/logout.cgi', '_blank', 'location=yes');
            ref.show();
        };

        $scope.login = function() {
        	new ping("https://webgate.ec.europa.eu/cas/images/favicon.ico", function (status, e) {
        		if (status != "responded") $scope.main.ping = false;
        		if (status == "responded") $scope.main.ping = true;
                console.log(status);

                if ($scope.main.connected && $scope.main.ping) {
                    ECASMobile.requestECASAuthentication(ch, fh);
            	} else {
                    var myPopup = $ionicPopup.show({
                        template: $translateWord('OFFLINE'),
                        title: $translateWord('CNTE'),
                        scope: $scope,
                        buttons: [
                            { text: $translateWord('KEPK') }
                        ]
                    });
            	}
            });
        	
        }

        var ch = function(json) {
            console.log(JSON.stringify(json));
        	var ECASusername = "";
            if (typeof json.data['cas:uid'] != 'undefined') {
                ECASusername = json.data['cas:uid'];
            } else {
                ECASusername = json.data['cas:user'];
            }
        	if (ECASusername.trim() != "") {
                if (typeof json.data['cas:domainUsername'] != 'undefined') {
                    $scope.main.user.ICCID = json.data['cas:domainUsername'];
                    $scope.main.user.ECASName = json.data['cas:domainUsername'];
                    $scope.main.user.ECASmail = json.data['cas:email'];
                    $scope.main.user.ECASuniqueID = json.data['cas:uid'];
                } else {
                    $scope.main.user.ICCID = json.data['cas:user'];
                    $scope.main.user.ECASName = json.data['cas:user'];
                    $scope.main.user.ECASmail = json.data['cas:moniker'];
                    $scope.main.user.ECASuniqueID = json.data['cas:user'];
                }
                $scope.loggedmsg = $translateWord('LGINK');
                n2db.userLogin($scope.main.user.ICCID, $scope.main.user.ECASName, $scope.main.user.ECASmail, $scope.main.user.ECASuniqueID);

                $scope.logoutVar = json.data['cas:proxyGrantingTicket'];
                $scope.resetview();
        	} else {
                $scope.resetview();
        	}
        };

        var fh = function(json) {
        	console.log("Not logged in!");
            console.log(JSON.stringify(json));
            $scope.main.user.ICCID = '';
            $scope.main.user.ECASName = '';
            $scope.main.user.ECASmail = '';
            $scope.main.user.ECASuniqueID = '';
            $scope.loggedmsg = $translateWord('LGINK');
            n2db.userLogout();
            $scope.resetview();

            /* Can't login  */
            if ( /*ionic.Platform.isIOS()*/ 1 == 1) {
                $ionicLoading.show({
                    template: $translateWord('CNCL'),
                    duration: 2000
                });
                $scope.resetview();
            }
        };
    });
})
;
