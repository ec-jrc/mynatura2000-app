angular.module('nat2000', ['ionic', 'nat2000.constants', 'ngCordova', "leaflet-directive", 'nat2000.controllers', 'nat2000.services', 'nat2000.directives', 'nat2000.filters', 'angular-click-outside', 'ngTouch', 'pascalprecht.translate'])

.run(function($ionicPlatform, n2db) {
    $ionicPlatform.ready(function() {

        /* ASK PERMISSIONS 

      ///cordova plugin add cordova-plugin-android-permissions@0.10.0

      */

      cordova.plugins.diagnostic.isLocationAvailable(function(available) {
          console.log("Location is " + (available ? "available" : "not available"));
      }, function(error) {
          console.log("The following error occurred: " + error);
      });

      var perms = ['WRITE_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'ACCESS_NETWORK_STATE'];

      if (ionic.Platform.isAndroid()) {
          function requestperms() {

              if (perms.length > 0) {
                  var value = perms.shift();

                  console.log('Check ' + value);

                  cordova.plugins.diagnostic.requestRuntimePermission(function(status) {
                      switch (status) {
                          case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                              console.log("Permission granted " + value);
                              break;
                          case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                              console.log("Permission has not been requested yet " + value);
                              break;
                          case cordova.plugins.diagnostic.permissionStatus.DENIED:
                              console.log("Permission denied " + value);
                              break;
                          case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                              console.log("Permission permanently denied " + value);
                              break;
                      }
                      requestperms();
                  }, function(error) {
                      console.log("The following error occurred: " + error + ' ' + value);
                      requestperms();
                  }, cordova.plugins.diagnostic.runtimePermission[value]);

              }
          }
          requestperms();
      }

      if (window.cordova && window.cordova.plugins.Keyboard) {
          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);

          console.log('Init service db from controller');
          var promise = n2db.setupDB();
          promise.then(function(result) {

              console.log('Success: ' + result);
              navigator.splashscreen.hide();

          }, function(result) {
              console.log('Failed: ' + result);
          });

          console.log('Init service db from controller - second notice');

          // Don't remove this line unless you know what you are doing. It stops the viewport
          // from snapping when text inputs are focused. Ionic handles this internally for
          // a much nicer keyboard experience.
          cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
          StatusBar.styleDefault();
      }
    });
})

//ROUTING//
.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    $ionicConfigProvider.views.forwardCache(true);

    $stateProvider

        .state('app', {
        cache: false,
        url: '/app',
        abstract: true,
        templateUrl: 'templates/app.html',
        controller: 'AppCtrl'
    })

    .state('app.home', {
        cache: false,
        url: '/home',
        views: {
            'mainContent': {
                templateUrl: 'templates/home.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('app.about', {
        cache: false,
        url: '/about',
        views: {
            'mainContent': {
                templateUrl: 'templates/about.html',
                controller: 'AboutCtrl'
            }
        }
    })

    .state('app.list', {
        cache: true,
        url: '/list',
        views: {
            'mainContent': {
                templateUrl: 'templates/list.html',
                controller: 'ListCtrl'
            }
        }
    })

    .state('app.map', {
        cache: false,
        url: '/map',
        views: {
            'mainContent': {
                templateUrl: 'templates/sitesmap.html',
                controller: 'MapCtrl'
            }
        }
    })

    .state('app.site', {
        url: '/site',
        views: {
            'mainContent': {
                templateUrl: 'templates/site-menu.html',
                controller: 'SiteMenuCtrl'
            }
        }
    })

    .state('app.site.about', {
        cache: false,
        url: '/siteabout/:siteId',
        views: {
            'siteContent': {
                templateUrl: 'templates/site-pics.html',
                controller: 'SitePicsCtrl'
            }
        }
    })

    .state('app.site.info', {
        cache: false,
        url: '/siteinfo/:siteId',
        views: {
            'siteContent': {
                templateUrl: 'templates/site-info.html',
                controller: 'SiteInfoCtrl'
            }
        }
    })


    .state('app.site.feedback', {
        cache: false,
        url: '/sitefeedback/:siteId',
        views: {
            'siteContent': {
                templateUrl: 'templates/site-feedback.html',
                controller: 'SiteFeedbackCtrl'
            }
        }
    })

    .state('app.site.map', {
        cache: false,
        url: '/sitemap/:siteId',
        views: {
            'siteContent': {
                templateUrl: 'templates/site-map.html',
                controller: 'SiteMapCtrl'
            }
        }
    })

    .state('app.site.report', {
        cache: false,
        url: '/sitereport/:siteId',
        views: {
            'siteContent': {
                templateUrl: 'templates/report-inner.html',
                controller: 'SiteReportCtrl'
            }
        }
    })

    .state('app.report', {
        cache: false,
        url: '/report',
        views: {
            'mainContent': {
                templateUrl: 'templates/report.html',
                controller: 'ReportCtrl'
            }
        }
    })

    .state('app.reportobservation', {
        cache: false,
        url: '/reportobservation/:type/:repId',
        views: {
            'mainContent': {
                templateUrl: 'templates/report-observation.html',
                controller: 'ReportObservationCtrl'
            }
        }
    })

    .state('app.reportfeedback', { /* uses the same controller */
        cache: false,
        url: '/reportfeedback/:type/:repId/:vote',
        views: {
            'mainContent': {
                templateUrl: 'templates/report-feedback.html',
                controller: 'ReportObservationCtrl'
            }
        }
    })

    .state('app.myreports', {
        cache: false,
        url: '/myreports',
        views: {
            'mainContent': {
                templateUrl: 'templates/myreports.html',
                controller: 'MyReportsCtrl'
            }
        }
    })

    .state('app.mysentreports', {
        cache: false,
        url: '/mysentreports',
        views: {
            'mainContent': {
                templateUrl: 'templates/mysentreports.html',
                controller: 'MySentReportsCtrl'
            }
        }
    })

    .state('app.login', {
        cache: false,
        url: '/login',
        views: {
            'mainContent': {
                templateUrl: 'templates/login.html',
                controller: 'LogInCtrl'
            }
        }
    })

    $urlRouterProvider.otherwise('/app/home'); /* replace with app/home */
})


.config(['$translateProvider', function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'languages/locale-',
        suffix: '.json'
    });
    $translateProvider.determinePreferredLanguage('en');
}])

.config(function($ionicConfigProvider) {
    //$ionicConfigProvider.views.maxCache(5);
    $ionicConfigProvider.backButton.text('').icon('ion-chevron-left');
    $ionicConfigProvider.views.swipeBackEnabled(false);
});