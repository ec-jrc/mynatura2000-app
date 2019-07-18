angular.module('nat2000.services', ['ngCordova'])

.factory('n2db', function($cordovaSQLite, $q, $http, $ionicPlatform, CONFIG, SERVER) {
    console.log('Called the service');
    var obj = {};



    /* get a static html file from the server (used in modals) */
    obj.getStatic = function(filename, lang) {
        return $q(function(resolve, reject) {
            console.log('In service for ' + filename + ' in lang: ' + lang);


            var query = 'SELECT * FROM Statics where name="' + filename + '" AND lang ="' + lang + '"';
            $cordovaSQLite.execute(obj.db, query).then(function(res) {
                if (res.rows.length == 1) {
                    //success
                    var html = decodeURI(res.rows.item(0).html);
                    var date = res.rows.item(0).date;
                    console.log('Local datas retrieved:')
                    console.log(res);
                    console.log(date);
                    console.log(html);
                    //// get headers from the server
                    console.log('checking online version');
                    console.log(cordova.file.applicationDirectory + "www/static/" + lang + "/" + filename + ".html");
                    $http({
                            method: 'HEAD',
                            ////url: CONFIG.staticfolder + lang + '/' + filename + '.html',
                            url: cordova.file.applicationDirectory + "www/static/" + lang + "/" + filename + ".html",
                            timeout: 1000
                        })
                        .then(function successCallback(data) {
                            console.log('success');
                            console.log(data);
                            console.log('headers:');
                            var headers = data.headers();
                            console.log(headers);
                            var lastmod = headers['last-modified'];
                            console.log('Server version date:');
                            console.log(lastmod);
                            console.log('Local version date:');
                            console.log(date);
                            ////success:
                            ///check if is more recent than the one I have
                            /*if (lastmod > date) {*/
                                //console.log('you have an old version');
                                ////downloads and saves it
                                $http({
                                    method: 'GET',
                                    url: CONFIG.staticfolder + lang + '/' + filename + '.html'
                                }).then(function successCallback(response) {
                                    /// success: returns that html
                                    html = response.data;
                                    console.log('got the new version');
                                    console.log(html);
                                    query = 'UPDATE Statics set date = "' + lastmod + '", html = "' + encodeURI(html) + '" WHERE name = "' + filename + '" AND lang = "' + lang + '" ';
                                    $cordovaSQLite.execute(obj.db, query);
                                    resolve(html);

                                }, function errorCallback(response) {
                                    /// error: returns old file (local)
                                    console.log('can not retrieve the new version');
                                    console.log('html:');
                                    console.log(html);
                                    resolve(html);
                                });
                            /*} else {
                                console.log('your version is ok');
                                resolve(html);
                            }*/


                        }, function errorCallback(response) {
                            ////error:
                            /// returns old file (local)
                            console.log('fail');
                            console.log(response);
                            resolve(html);
                        });

                } else { // if no result in DB
                    console.log(cordova.file.applicationDirectory + "www/static/" + lang + "/" + filename + ".html");
                    $http({
                        method: 'GET',
                        ////url: CONFIG.staticfolder + lang + '/' + filename + '.html'
                        url: cordova.file.applicationDirectory + "www/static/" + lang + "/" + filename + ".html"
                    }).then(function successCallback(response) {
                        /// success: returns that html
                        html = response.data;
                        console.log('got the new version');
                        console.log(html);
                        query = 'UPDATE Statics set date = "0", html = "' + encodeURI(html) + '" WHERE name = "' + filename + '" AND lang = "' + lang + '" ';
                        $cordovaSQLite.execute(obj.db, query);
                        resolve(html);

                    }, function errorCallback(response) {
                        /// error: returns old file (local)
                        $http({
                            method: 'GET',
                            url: './static/' + lang + '/' + filename + '.html'
                        }).then(function successCallback(response) {
                            console.log('Local File:');
                            console.log(response);
                            //var date = new Date(0); LUCAS
                            var date = new Date().getTime();
                            var html = response.data;
                            console.log('html:');
                            console.log(html);
                            resolve(html);

                        });
                    });
                }

            });

        }); // close return q
    };




    /* Setting up DB */

    obj.setupDB = function() {

        return $q(function(resolve, reject) {

            console.log('Setting up the Database');

            obj.db = $cordovaSQLite.openDB({ name: "dbnat2000.db", iosDatabaseLocation: 'default' });

            obj.db.sqlBatch([
                'CREATE TABLE IF NOT EXISTS Entry (id, type, feedback, lat, long, date, comment, picturetype, anonymous)',
                'CREATE TABLE IF NOT EXISTS Pics (entry, data)',
                'CREATE TABLE IF NOT EXISTS Statics (name, lang, date, html)',
                'CREATE TABLE IF NOT EXISTS User (id, ICCID, ECASName, ECASmail, ECASuniqueID)'
                //$cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS static (id integer primary key, name text, lang text, date integer, html text)");
            ], function() {
                resolve('DB Service; Populated database OK');
            }, function(error) {
                reject('DB Service; SQL batch ERROR: ' + error.message);
            });


        });

    };


    /* saves user login data */
    obj.userLogin = function(iccid, ecasname, ecasmail, ecasuid) {

        return $q(function(resolve, reject) {

            obj.db.sqlBatch([
                'DELETE FROM User WHERE id=19',
                'INSERT INTO User (id, ICCID, ECASName, ECASmail, ECASuniqueID) VALUES(19, "' + iccid + '", "' + ecasname + '", "' + ecasmail + '", "' + ecasuid + '")'
            ], function() {
                resolve('DB Service; database OK');
            }, function(error) {
                reject('DB Service; SQL batch ERROR: ' + error.message);
            });


        });
    };

    /* clear user login data */
    obj.userLogout = function() {

        return $q(function(resolve, reject) {

            obj.db.sqlBatch([
                'DELETE FROM User WHERE id=19'
            ], function() {
                resolve('DB Service; database OK');
            }, function(error) {
                reject('DB Service; SQL batch ERROR: ' + error.message);
            });


        });
    };

    obj.getUser = function() {
        console.log('Retrieving user data...');
        var query = 'SELECT * FROM User WHERE id = 19';
        var user = {
            ICCID: '',
            ECASName: '',
            ECASmail: '',
            ECASuniqueID: ''
        };
        return $q(function(resolve, reject) {

            $cordovaSQLite.execute(obj.db, query).then(function(res) {
                if (res.rows.length == 1) {

                    console.log('User data retrieved');
                    console.log(res.rows);
                    user.ICCID = res.rows.item(0).ICCID;
                    user.ECASName = res.rows.item(0).ECASName;
                    user.ECASmail = res.rows.item(0).ECASmail;
                    user.ECASuniqueID = res.rows.item(0).ECASuniqueID;

                } else {
                    console.log('No user data stored');
                    /* Da cancellare */
                    //user.ICCID = 'mittoir';
                    //user.ECASName = 'mittoir';
                    //user.ECASmail = 'irena.mitton@ext.ec.europa.eu';
                    //user.ECASuniqueID = 'mittoir';
                }
                console.log(user);
                resolve(user);
            }, function(err) {
                console.log('DB error in retrieving user data');
                console.log(user);
                resolve(user);
            });

        });
    };




    /* saves a report [working] */
    obj.saveReport = function(datas) {
        return $q(function(resolve, reject) {

            console.log('start saving datas');
            console.log(datas);

            var arrayquery = [];
            if (datas.date === null) {
            	datas.date = new Date();
            }
            if (datas.date == "null") {
            	datas.date = new Date();
            }
            arrayquery[0] = 'INSERT INTO Entry (id, type, feedback, lat, long, date, comment, picturetype, anonymous) VALUES("' + datas.id + '", "' + datas.type + '", "' + datas.feedback + '", "' + datas.lat + '","' + datas.long + '","' + datas.date + '","' + datas.comment + '","' + datas.picturetype + '","' + datas.anonymous + '")';

            var count = 1;

            angular.forEach(datas.pictures, function(value, key) {
                arrayquery[count] = 'INSERT INTO Pics (entry, data) VALUES("' + datas.id + '","' + value + '")';
                count++;
            });


            obj.db.sqlBatch(arrayquery, function() {
                console.log('Data and Pictures inserted');
                resolve(datas.id);
            }, function(error) {
                console.log('SQL batch ERROR: ' + error.message);
                reject(error.message);
            });

        });
    };

    /* update a report [working] */
    obj.updateReport = function(datas) {
        return $q(function(resolve, reject) {
            console.log('start updating datas');
            console.log(datas);

            if (datas.date === null) {
            	datas.date = new Date();
            }
            if (datas.date == "null") {
            	datas.date = new Date();
            }

            var arrayquery = [];
            arrayquery[0] = 'UPDATE Entry SET feedback = "' + datas.feedback + '", lat = "' + datas.lat + '", long="' + datas.long + '", date="' + datas.date + '", comment="' + datas.comment + '", picturetype="' + datas.picturetype + '", anonymous="' + datas.anonymous + '" where id="' + datas.id + '"';
            arrayquery[1] = 'DELETE FROM Pics where entry="' + datas.id + '"';
            console.log(arrayquery[0]);
            console.log(arrayquery[1]);

            var count = 2;

            angular.forEach(datas.pictures, function(value, key) {
                arrayquery[count] = 'INSERT INTO Pics (entry, data) VALUES("' + datas.id + '","' + value + '")';
                console.log(arrayquery[count]);
                count++;
            });


            obj.db.sqlBatch(arrayquery, function() {
                console.log('Data and Pictures updated');
                resolve(datas.id);
            }, function(error) {
                console.log('SQL batch ERROR: ' + error.message);
                reject(error.message);
            });

        });
    };



    /* delete a report [working] */
    obj.deleteReport = function(id) {
        return $q(function(resolve, reject) {
            console.log('start deleting datas');
            console.log(id);


            var arrayquery = [];


            if (id == 'all') {
                arrayquery[0] = 'DELETE FROM Entry';
                arrayquery[1] = 'DELETE FROM Pics';
            } else {
                arrayquery[0] = 'DELETE FROM Entry where id="' + id + '"';
                arrayquery[1] = 'DELETE FROM Pics where entry="' + id + '"';
            }

            obj.db.sqlBatch(arrayquery, function() {
                console.log('Data and Pictures deleted');
                resolve(true);
            }, function(error) {
                console.log('SQL batch ERROR: ' + error.message);
                reject(false);
            });
        });

    };




    obj.getReportData = function(id) {
        var query = 'SELECT * FROM Entry where id="' + id + '"';
        // return promise!
        var singlerowdata = [];

        return $cordovaSQLite.execute(obj.db, query).then(function(res) {
            if (res.rows.length == 1) {
                singlerowdata['type'] = res.rows.item(0).type;
                singlerowdata['id'] = res.rows.item(0).id;
                singlerowdata['feedback'] = res.rows.item(0).feedback;
                singlerowdata['lat'] = Number(res.rows.item(0).lat);
                singlerowdata['long'] = Number(res.rows.item(0).long);
                singlerowdata['date'] = new Date(res.rows.item(0).date);
                singlerowdata['comment'] = res.rows.item(0).comment;
                singlerowdata['picturetype'] = Number(res.rows.item(0).picturetype);
                singlerowdata['anonymous'] = res.rows.item(0).anonymous;
                console.log(singlerowdata); //Result - Working..
                return singlerowdata; //Result - Undefined..  

            }
            console.log("No entry found with id " + id);
            // return false if nothing found
            return false;
        });
    };

    obj.getReportPictures = function(id) {
        var query = 'SELECT * FROM pics where entry="' + id + '"';
        // return promise!
        var singlerowdata = [];
        singlerowdata['pictures'] = [];

        return $cordovaSQLite.execute(obj.db, query).then(function(res) {
            if (res.rows.length >= 1) {

                for (var i = 0; i < res.rows.length; i++) {
                    singlerowdata['pictures'][i] = res.rows.item(i).data;
                }
                console.log('Pictures for entry #' + id); //Result - Working..
                console.log(singlerowdata); //Result - Working..
                return singlerowdata; //Result - Undefined..                
            }
            console.log("No pictures found for entry #" + id);
            // return false if nothing found
            return false;
        });
    };


    /*
    obj.getReports = function() {
        var query = 'SELECT * FROM Entry';
        // return promise!
        var entry = [];

        return $cordovaSQLite.execute(obj.db, query).then(function(res) {
            if (res.rows.length >= 1) {

                for (var i = 0; i < res.rows.length; i++) {
                    entry[i] = [];

                    entry[i]['id'] = res.rows.item(i).id;
                    entry[i]['type'] = res.rows.item(i).type;
                    entry[i]['date'] = new Date(res.rows.item(i).date);
                    entry[i]['picturetype'] = res.rows.item(i).picturetype;
                    entry[i]['feedback'] = res.rows.item(i).feedback;
                    entry[i]['pictures'] = "";

                    if (entry[i]['type'] == 0) {
                        obj.getReportPictures(entry[i]['id']).then(function(data) {
                        	console.log(data);
                            if (data) {
                                entry[i]['pictures'] = data.pictures;
                                console.log(data.pictures);
                            } else {
                                entry[i]['pictures'] = new Array();
                            }
                        }, function(err) {
                            // if failing
                        	entry[i]['pictures'] = new Array();
                        });
                    }
                }
                //console.log(entry); //Result - Working..
                return entry; //Result - Undefined..
            }
            //console.log("No reports found");
            // return false if nothing found
            return false;
        });
    };
    */


    obj.getReports = function() {
        var query = 'SELECT * FROM Entry';
        return $q(function(resolve, reject) {

            var entry = [];

        	$cordovaSQLite.execute(obj.db, query).then(function(res) {
	            if (res.rows.length >= 1) {
	            	for (var i = 0; i < res.rows.length; i++) {
	                    entry[i] = [];
	
	                    entry[i]['id'] = res.rows.item(i).id;
	                    entry[i]['type'] = res.rows.item(i).type;
	                    entry[i]['date'] = new Date(res.rows.item(i).date);
	                    entry[i]['picturetype'] = res.rows.item(i).picturetype;
	                    entry[i]['feedback'] = res.rows.item(i).feedback;
	                    entry[i]['pictures'] = "";
                    	if (i == (res.rows.length-1)) {
                    		angular.forEach(entry, function(value, key) {
        	                    if (value.type == 0) {
        	                    	obj.getReportPictures(value.id).then(function(data) {
        	                            if (data) {
        	                            	entry[key]['pictures'] = data.pictures;
        	                            } else {
        	                            	entry[key]['pictures'] = new Array();
        	                            }
        	                        }, function(err) {
        	                            // if failing
        	                        	entry[key]['pictures'] = new Array();
        	                        });
        	                    }
                    		});
        	                $q.all(entry).finally(function() {
                                resolve(entry);
        	                });
                    	}
	                }
	            } else {
		            reject(false);
	            }
	        });
        });
    };

    
    function delay(ms) {
    	ms += new Date().getTime();
    	while (new Date() < ms){}
    }

    obj.sendReport = function(id, user) {
        return $q(function(resolve, reject) {
            obj.getReportData(id).then(function(reportdata) {
                obj.getReportPictures(id).then(function(reportpics) {
                    console.log('Pictures, before');
                    console.log(reportpics.pictures);
                    if (reportpics.pictures === undefined) {
                        console.log('redefining pictures to avoid errors');
                        reportpics = {};
                        reportpics.pictures = [];
                    }
                    console.log('Pictures, after');
                    console.log(reportpics.pictures);


                    console.log('Service for sending got datas');
                    console.log(reportdata);
                    console.log(reportpics.pictures);
                    console.log('now should save - type: ' + reportdata.type);
                    console.log('is type numeric?: ' + !isNaN(reportdata.type));
                    /* Checking if it is complete or not */
                    console.log('Start check');
                    console.log('lat: ' + !isNaN(reportdata.lat));
                    console.log('long: ' + !isNaN(reportdata.long));
                    console.log('General 1 ' + (
                        (reportdata.type == 1 && reportdata.feedback.length == 1) ||
                        (reportdata.type == 0 /*&& reportdata.comment.length>5*/ && reportdata.picturetype && reportpics.pictures.length > 0)
                    ));
                    console.log('reportdata.type ' + reportdata.type);
                    console.log('reportdata.feedback.length ' + reportdata.feedback.length);
                    console.log('reportdata.comment.length ' + reportdata.comment.length);
                    console.log('reportdata.picturetype ' + reportdata.picturetype);
                    console.log('reportpics.length ' + reportpics.pictures.length);
                    console.log('first eval ' + (reportdata.type == 1 && reportdata.feedback.length == 1));
                    console.log('second eval ' + (reportdata.type == 0 && reportdata.comment.length > 5 && reportdata.picturetype && reportpics.pictures.length > 0));


                    var arrayfeedbacks = ['0', '1', '-1'];

                    if (!isNaN(reportdata.lat) && !isNaN(reportdata.long) &&
                        (
                            (reportdata.type == 1 && arrayfeedbacks.indexOf(reportdata.feedback) > -1) ||
                            (reportdata.type == 0 && /*reportdata.comment.length>5 &&*/ reportdata.picturetype && reportpics.pictures.length > 0)
                        )
                    ) {
                        /* it's complete */
                        /* now should send it to the API */
                        if (reportdata.anonymous !== "true") {
                            reportdata.anonymous = false;
                        } else {
                            reportdata.anonymous = true;
                        }

                        var req = {
                            method: 'POST',
                            url: SERVER.serverApiUrl + CONFIG.path_rest,
                            data: {
                                observedAt: reportdata.date,
                            	properties: {
                                    ICCID: user.ICCID,
                                    ECASName: user.ECASName,
                                    ECASmail: user.ECASmail,
                                    ECASuniqueID: user.ECASuniqueID,
                                    Code: '',
                                    Comment: reportdata.comment,
                                    Type: reportdata.picturetype,
                                    EmoticonValue: reportdata.feedback,
                                    Anonymous: reportdata.anonymous,
                                    Image: reportpics.pictures
                                },
                                geometry: {
                                    coordinates: [reportdata.long, reportdata.lat],
                                    type: 'Point'
                                },
                                type: Math.abs(reportdata.type - 1)
                            }
                        }
                        delay(2000);
                        console.log('What I am sending:');
                        console.log(JSON.stringify(req));
                        $http(req).then(
                            function(data) {
                                console.log(JSON.stringify(data));
                                obj.deleteReport(id).then(
                                    function() {
                                    	console.log("Record with ID " + id + " deleted!")
                                        resolve(data);
                                    },
                                    function() {
                                    	console.log("Record with ID " + id + " NOT deleted!")
                                        reject(data);
                                    });

                            },
                            function(data) {
                                console.log(JSON.stringify(data));
                                reject(data);
                            }
                        );


                    } else {
                        reject(false);
                    }

                });
            });
        });
    };

    /* sends all drafts to server */
    obj.sendAllReports = function(user) {

        return $q(function(resolve, reject) {

            obj.getReports().then(function(reports) {
                /* scroll through every report saved in drafts */
                var count = 0;
                var promises = [];

                /* create promise to upload all of them */
                angular.forEach(reports, function(value, key) {

                    console.log('report: ' + value.id);
                    promises[count] = obj.sendReport(value.id, user);
                    count++;

                });

                /* if there are no reports, nothing happens */
                if (count == 0) {
                    console.log('no reports!');
                    reject(true);
                }

                /* when all promises are resolved scroll through them and get pics*/
                $q.all(promises).finally(function() {
                    var fails = 0;
                    angular.forEach(promises, function(value, key) {

                        console.log('promise:');
                        console.log(value);
                        console.log('status: ' + value.$$state.status);
                        if (value.$$state.status == 2) {
                            console.log('failed');
                            fails++;
                        }

                    });
                    if (fails == 0) {
                        console.log('end of send all service, everything sent');
                        resolve(true);
                    } else {
                        console.log('end of send all service, errors');
                        reject(false);
                    }

                });



            });

        });
    };




    console.log('Reached the end of the service');
    return obj;

})



.factory('n2serv', function($http, CONFIG, SERVER, $q) {
    var obj = {};


    /* returns a list of sites, 100 elements at time */
    obj.getSiteListPartial = function(limit) {
        return sites.slice(limit, limit + 100);
    };

    obj.getSiteListAll = function() {
        return sites;
    };

    /* returns site markers next to a latitude/longitude */
    obj.getSiteMarkers = function(lat, long){
        markers={};  

        angular.forEach(sites, function(value, key) {
            
    		if (value.SITETYPE == "A") {
    			value.SITETYPE = "2";
    		}
    		if (value.SITETYPE == "B") {
    			value.SITETYPE = "1";
    		}
    		if (value.SITETYPE == "C") {
    			value.SITETYPE = "3";
    		}
            if(
            
            (value.SLAT > lat-0.3 && value.SLAT < lat+0.3) &&
            (value.SLON > long-0.3 && value.SLON < long+0.3)
                
            ) {
          	  				markers[value.SITECODE] = {
                                    id: value.SITECODE,
                                    lat: Number(value.SLAT),
                                    lng: Number(value.SLON),
                                    icon: {
                                      iconUrl: 'img/sitetype/'+value.SITETYPE+'.svg',
                                      iconSize: [20, 20],
                                      iconAnchor: [10, 10]
                                    }
                                };
            }
   
          });
        
       
       return markers; 
        
    };

    obj.getdistance = function(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295; // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    /* returns info for the site closer to a latitude/longitude */
    /* returns info for the site closer to a latitude/longitude */
    obj.getNearbySite = function(lat, long){
        var distance=5;
        var site={id:'', name: '', type: 0}; 
        return $q(function(resolve, reject) {
            angular.forEach(sites, function(value, key) {
          	  var latA = value.BBOX[0][1];
          	  var longA = value.BBOX[0][0];
          	  var latB = value.BBOX[1][1];
          	  var longB = value.BBOX[1][0];
                // var newdistance = obj.getdistance(lat, long,  Number(value.LATITUDE),  Number(value.LONGITUDE));
          	  var newdistance = 10;
          	  if ((latB <= lat) && (lat <= latA) && (longA <= long) && (long <= longB)) {
          		  newdistance = 0;
          	  }

                if( newdistance<distance ){
                    site = {
                        id: value.SITECODE,
                        type: value.SITETYPE,
                        name: value.SITENAME
                    };
                    distance=newdistance;
                    console.log("CLOSE SITE: "+value.SITENAME+" distance "+distance);
                }

           });
           resolve(site); 
        });
    };

    /* returns a list of countries */
    obj.getCountries = function() {
        return countries; /* from extra_data.js */
    };


    /* retrieves the whole list of feedbacks */
    obj.getAllFeedbacks = function(feedcache) {
        console.log('Getting All feedbacks');
        return $q(function(resolve, reject) {
            if (typeof feedcache === 'undefined') {
                feedcache = true;
            }
            $http.get(SERVER.serverApiUrl + CONFIG.path_rest, { cache: feedcache, timeout: 6000 }).then(function successCallback(response) {
                console.log('All feedbacks retrieved');
                console.log(response);
                ///the only controller requesting cache false is the one we use for our own feedbacks. So when you have cache true I have to hide all the not approved reports
                if (feedcache == true) {
                    console.log('Have to filter feedbacks in order to get only the APPROVED');
                    var newdata = [];
                    angular.forEach(response.data, function(value, key) {
                        if (value.properties.Status == 'approved') {
                            newdata.push(value);
                        }
                    });
                    ///this is to make everything compatible with what I already had
                    response.data = newdata;
                }
                console.log('Sending feedbacks forward:');
                console.log(response);
                resolve(response);

            }, function errorCallback(response) {
                console.log(reject);
                resolve(reject);
            });



        });
    };


    /* retrieves the whole list of feedbacks */
    obj.getOnlyUserFeedbacks = function(userID) {
        console.log('Getting User feedbacks');
        return $q(function(resolve, reject) {
            var feedcache = false;
    		var MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
    		var hashOAUTHID = (MD5(userID));
    		$http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/user/' + hashOAUTHID, { cache: feedcache, timeout: 6000 }).then(function successCallback(response) {
                console.log('User feedbacks retrieved');
                console.log(response);
                ///the only controller requesting cache false is the one we use for our own feedbacks. So when you have cache true I have to hide all the not approved reports
                //if (feedcache == true) {
                    var newdata = [];
                    angular.forEach(response.data, function(value, key) {
                    	newdata.push(value);
                    });
                    ///this is to make everything compatible with what I already had
                    response.data = newdata;
                //}
                console.log('Sending feedbacks forward:');
                console.log(response);
                resolve(response);

            }, function errorCallback(response) {
                console.log(reject);
                resolve(reject);
            });



        });
    };

    /* retrieves paged list of feedbacks */
    obj.getOnlyUserPagedFeedbacks = function(userID, start, end) {
        console.log('Getting User feedbacks');
        return $q(function(resolve, reject) {
            var feedcache = false;
    		var MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
    		var hashOAUTHID = (MD5(userID));
    		$http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/page/' + hashOAUTHID + '/' + start + '/' + end, { cache: feedcache, timeout: 6000 }).then(function successCallback(response) {
                console.log('User feedbacks retrieved');
                console.log(response);
                ///the only controller requesting cache false is the one we use for our own feedbacks. So when you have cache true I have to hide all the not approved reports
                //if (feedcache == true) {
                    var newdata = [];
                    angular.forEach(response.data, function(value, key) {
                    	newdata.push(value);
                    });
                    ///this is to make everything compatible with what I already had
                    response.data = newdata;
                //}
                console.log('Sending feedbacks forward:');
                console.log(response);
                resolve(response);

            }, function errorCallback(response) {
                console.log(reject);
                resolve(reject);
            });



        });
    };

    /* retrieves the whole list of feedbacks */
    obj.getOnlySiteFeedbacks = function(siteID) {
        console.log('Getting Site feedbacks');
        return $q(function(resolve, reject) {
            var feedcache = false;
    		$http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/site/' + siteID, { cache: feedcache, timeout: 6000 }).then(function successCallback(response) {
                console.log('Site feedbacks retrieved');
                console.log(response);
                ///the only controller requesting cache false is the one we use for our own feedbacks. So when you have cache true I have to hide all the not approved reports
                //if (feedcache == true) {
                    var newdata = [];
                    angular.forEach(response.data, function(value, key) {
                    	newdata.push(value);
                    });
                    ///this is to make everything compatible with what I already had
                    response.data = newdata;
                //}
                console.log('Sending feedbacks forward:');
                console.log(response);
                resolve(response);

            }, function errorCallback(response) {
                console.log(reject);
                resolve(reject);
            });



        });
    };
    
    
    
    /* returns a list of pictures for a site */
    obj.getSitePics = function(lat, long) {

        lat = Number(lat);
        long = Number(long);

        return $q(function(resolve, reject) {

            var pictarray = [];
            emptyCall = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + 'empty', { timeout: 3000 });
            obj.getAllFeedbacks(false).then(function(feeds) { //true
                /* scroll through every feedback to filter those near to our location */
                var count = 0;
                var promises = [];

                /* should retrieve pics in every item, create promises */
                angular.forEach(feeds.data, function(value, key) {
                    console.log('feed ' + value._id + ': lat ' + value.geometry.coordinates[0] + ' (' + lat + ' )' +
                        ' long ' + value.geometry.coordinates[1] + ' (' + long + ' )');
                    if (value.type == '1' &&
                        (value.geometry.coordinates[0] > (lat - 0.5) && value.geometry.coordinates[0] < (lat + 0.5) &&
                            value.geometry.coordinates[1] > (long - 0.5) && value.geometry.coordinates[1] < (long + 0.5))) {

                        console.log('added to promises');
                        promises[count] = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + value._id, { timeout: 3000 });
                        count++;
                    }

                });

                /* if there are no pictures a sample picture is served */
                if (count == 0) {
                    console.log('no pictures!');
                    pictarray = [CONFIG.nopic];
                    resolve(pictarray);
                }

                /* when all promises are resolved scroll through them and get pics*/
                $q.all(promises).then(function() {
                    console.log('All promises resolved');
                    angular.forEach(promises, function(value, key) {

                        pictarray = pictarray.concat(value.$$state.value.data.properties.Image);

                    });
                    console.log('Pics service have:');
                    console.log(pictarray);

                    if (pictarray.length < 1) {
                        pictarray = [CONFIG.nopic]; /* if there are no pics I pass them the placeholder */
                    }

                    console.log('serving array of pics');
                    resolve(pictarray);
                }, function(reason) {
                    console.log('Get pictures failed: ' + reason);
                    pictarray = [CONFIG.nopic];
                    resolve(pictarray); /* I resolve the promise the same, but passing the placeholder pic */
                });



            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                pictarray = [CONFIG.nopic];
                resolve(pictarray); /* I resolve the promise the same, but passing the placeholder pic */
            });

        });
    };

    /* returns a list of pictures for a site by Id */
    obj.getSitePicsById = function(siteId) {

        return $q(function(resolve, reject) {

            var pictarray = [];
            //obj.getAllFeedbacks(true).then(function(feeds) {
            obj.getOnlySiteFeedbacks(siteId).then(function(feeds) {
                /* scroll through every feedback to filter those near to our location */
                var count = 0;
                var promises = [];

                /* should retrieve pics in every item, create promises */
                angular.forEach(feeds.data, function(value, key) {
                    //if ((value.type == '1') && (isInArray(siteId, value.properties.Code))) {
                    if ((value.type == '1') && (value.properties.Status == "approved")) {
                        console.log('added to promises');
                        promises[count] = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + value._id, { timeout: 3000 });
                        promises = promises.sort(function() { return .5 - Math.random() });// shuffle  
                        count++;
                    }

                });

                /* if there are no pictures a sample picture is served */
                if (count == 0) {
                    console.log('no pictures!');
                    pictarray = [CONFIG.nopic];
                    /*
                    console.log("PING: " + CONFIG.server + CONFIG.path_rest + '/' + 'empty');
                    var pingUrl = CONFIG.server + CONFIG.path_rest + '/' + 'empty';
                    $http({ method: 'GET', url: pingUrl}).then(function successCallback(response) {
                    	// this callback will be called asynchronously
                    	// when the response is available
                        pictarray = [CONFIG.nopic];
                    	console.log("GOOD: " + pictarray);
                        resolve(pictarray);
                    }, function errorCallback(response) {
                    	// called asynchronously if an error occurs
                    	// or server returns response with an error status.
                        pictarray = [CONFIG.nocon];
                    	console.log("BAD: " + pictarray);
                        resolve(pictarray);
                    });
                    */
                }

                /* when all promises are resolved scroll through them and get pics*/
                $q.all(promises).then(function() {
                    console.log('All promises resolved');
                    angular.forEach(promises, function(value, key) {
                    	pictarray = pictarray.concat(value.$$state.value.data.properties.Image);
                    });
                    console.log('Pics service have:');
                    console.log(pictarray);

                    if (pictarray.length < 1) {
                        pictarray = [CONFIG.nopic]; /* if there are no pics I pass them the placeholder */
                    //} else {
                    //    var shuffled = pictarray.sort(function() { return .5 - Math.random() });// shuffle  
                    //    $q.all(shuffled).then(function() {
                    //    	pictarray = shuffled.slice(0, 5);
                    //        console.log('serving array of pics');
                    //        resolve(pictarray);
                    //    });
                    }
                    pictarray = pictarray.slice(0, 5);
                    console.log('serving array of pics');
                    resolve(pictarray);

                }, function(reason) {
                    console.log('Get pictures failed: ' + reason);
                    pictarray = [CONFIG.nopic];
                    resolve(pictarray); /* I resolve the promise the same, but passing the placeholder pic */
                });



            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                pictarray = [CONFIG.nopic];
                resolve(pictarray); /* I resolve the promise the same, but passing the placeholder pic */
            });

        });
    };


    /* returns a specific site, working */
    obj.getSiteById = function(id) {
        var result = {};
        angular.forEach(sites, function(value, key) {

            if (value.SITECODE == id) {
        		if (value.SITETYPE == "A") {
        			value.SITETYPE = "2";
        		}
        		if (value.SITETYPE == "B") {
        			value.SITETYPE = "1";
        		}
        		if (value.SITETYPE == "C") {
        			value.SITETYPE = "3";
        		}
                result = value;
            }

        });
        return result;
    };


    /* returns a specific country */
    obj.getCountryById = function(id) {
        var result = {};
        angular.forEach(countries, function(value, key) {

            if (value.country == id) {
                result = value.name;
            }

        });
        return result;
    };


    function isInArray(value, array) {
  	  return array.indexOf(value) > -1;
    }

    /* overall feedbacks for a site */
    obj.getOverallFeedback = function(lat, long) {

        lat = Number(lat);
        long = Number(long);

        return $q(function(resolve, reject) {

            var result = 0;

            obj.getAllFeedbacks(false).then(function(feeds) { //true

                /* goes through results and counts */
                var count = 0;
                angular.forEach(feeds.data, function(value, key) {


                    if (value.type == '0' &&
                        (value.geometry.coordinates[0] > (lat - 0.5) && value.geometry.coordinates[0] < (lat + 0.5) &&
                            value.geometry.coordinates[1] > (long - 0.5) && value.geometry.coordinates[1] < (long + 0.5))) {
                        count++;
                        result += Number(value.properties.EmoticonValue);
                    }

                });

                if (count != 0) {
                    resolve(result);
                } else {
                    resolve(false);
                }


            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(false); /* I resolve the promise the same with false */
            });

        });
    };

    /* overall feedbacks for a site by Id */
    obj.getOverallFeedbackById = function(siteId) {
        return $q(function(resolve, reject) {
            var result = 0;
            var emoticonVote;
            //obj.getAllFeedbacks(true).then(function(feeds) {
            obj.getOnlySiteFeedbacks(siteId).then(function(feeds) {
                var count = 0;
                angular.forEach(feeds.data, function(value, key) {
                    //if ((value.type == '0') && (isInArray(siteId, value.properties.Code))) {
                    if ((value.type == '0') && (value.properties.Status == "approved")) {
                        count++;
                        if (Number(value.properties.EmoticonValue) > 0)  emoticonVote = 1;
                        if (Number(value.properties.EmoticonValue) < 0)  emoticonVote = -1;
                        if (Number(value.properties.EmoticonValue) == 0)  emoticonVote = 0;
                        result += Number(emoticonVote);
                    }
                });
                if (count != 0) {
                    resolve(result);
                } else {
                    resolve(false);
                }
            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(false); /* I resolve the promise the same with false */
            });

        });
    };



    /* feedback list */

    obj.getFeedbacks = function(lat, long) {
        lat = Number(lat);
        long = Number(long);
        return $q(function(resolve, reject) {
            var result = [];
            obj.getAllFeedbacks(false).then(function(feeds) {  //true
                /* goes through results and counts */
                angular.forEach(feeds.data, function(value, key) {
                    if (value.type == '0' &&
                        (value.geometry.coordinates[0] > (lat - 0.5) && value.geometry.coordinates[0] < (lat + 0.5) &&
                            value.geometry.coordinates[1] > (long - 0.5) && value.geometry.coordinates[1] < (long + 0.5))) {

                        result.push({ feedback: value.properties.EmoticonValue, user: value.properties.ECASName, anonymous: value.properties.Anonymous, id: value._id, Status: value.properties.Status, createdAt: value.properties.createdAt });
                    }
                });
                resolve(result);
            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(result); /* I resolve the promise with an empty array. Controller should manage it */
            });

        });
    };


    /* feedback list */
    
    obj.getFeedbacksById = function(siteId) {
        return $q(function(resolve, reject) {
            var result = [];
            var negative = 0;
            var neutral = 0;
            var positive = 0;
            obj.getAllFeedbacks(false).then(function(feeds) {  //true
                /* goes through results and counts */
                angular.forEach(feeds.data, function(value, key) {
                    if ((value.type == '0') && (isInArray(siteId, value.properties.Code))) {
                        if (value.properties.EmoticonValue < 0) negative++;
                        if (value.properties.EmoticonValue == 0) neutral++;
                        if (value.properties.EmoticonValue > 0) positive++;
                        //result.push({ feedback: value.properties.EmoticonValue, user: value.properties.ECASName, anonymous: value.properties.Anonymous, id: value._id, Status: value.properties.Status, createdAt: value.properties.createdAt });
                    }
                });
                var totalFeedback = negative + neutral + positive;
                result.push({ value: positive, total: totalFeedback, feedback: 1, user: "Positive", anonymous: false, id: 1, Status: "approved", createdAt: "-" });
                result.push({ value: neutral, total: totalFeedback, feedback: 0, user: "Neutral", anonymous: false, id: 0, Status: "approved", createdAt: "-" });
                result.push({ value: negative, total: totalFeedback, feedback: -1, user: "Negative", anonymous: false, id: -1, Status: "approved", createdAt: "-" });
                resolve(result);
            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(result); /* I resolve the promise with an empty array. Controller should manage it */
            });

        });
    };

    /* gets markers for feedbacks for a specified site */
    obj.getMarkersBySite = function(lat, long) {
        lat = Number(lat);
        long = Number(long);
        return $q(function(resolve, reject) {
            var pin = {
                iconUrl: 'img/pin.svg',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            };
            var point = {
                iconUrl: 'img/point.svg',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            };
            var markers = {};
            obj.getAllFeedbacks(false).then(function(feeds) { //true
                var count = 0;
                angular.forEach(feeds.data, function(value, key) {
                    if ((value.geometry.coordinates[0] > (lat - 0.5) && value.geometry.coordinates[0] < (lat + 0.5) &&
                            value.geometry.coordinates[1] > (long - 0.5) && value.geometry.coordinates[1] < (long + 0.5))) {
                        var icon = pin;
                        if (value.type == '0') { icon = point; }
                        markers[count] = {
                            id: value._id,
                            lat: value.geometry.coordinates[1],
                            lng: value.geometry.coordinates[0],
                            icon: icon
                        };
                        count++;
                    }
                });
                resolve(markers);
            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(markers); /* I resolve the promise the same, passing an empty array */
            });
        });
    };

    /* gets markers for feedbacks for a specified site by Id */
    obj.getMarkersBySiteId = function(siteId) {
        return $q(function(resolve, reject) {
            var pin = {
                iconUrl: 'img/pin.svg',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            };
            var point = {
                iconUrl: 'img/point.svg',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            };
            var markers = {};
            obj.getOnlySiteFeedbacks(siteId).then(function(feeds) {
                var count = 0;
                angular.forEach(feeds.data, function(value, key) {
                    //if (isInArray(siteId, value.properties.Code)) {
                	if (value.properties.Status == "approved") {
                        var icon = pin;
                        if (value.type == '0') { icon = point; }
                        markers[count] = {
                            id: value._id,
                            lat: value.geometry.coordinates[1],
                            lng: value.geometry.coordinates[0],
                            icon: icon
                        };
                        count++;
                    }
                });
                resolve(markers);

            }, function(reason) {
                console.log('Get all feedbacks failed: ' + reason);
                resolve(markers); /* I resolve the promise the same, passing an empty array */
            });

        });
    };

    
    /* returns a specific feedback */
    obj.getFeedbackById = function(id) {
        return $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + id, { cache: true, timeout: 3000 }); //1. this returns promise
    };




    /* Gets reports (approved or not) from a specific user. */
    /*
    obj.getUserReports = function(id) {
        return $q(function(resolve, reject) {
            var result = [];
            obj.getAllFeedbacks(true).then(function(feeds) {
                angular.forEach(feeds.data, function(value, key) {
                    if (value.properties.ECASuniqueID == id) {
                        result.push(value);
                    }
                });
                resolve(result);
            });
        });
    };
    */

    /*
    obj.getUserReports = function(id) {
        return $q(function(resolve, reject) {
            var reparray = [];
            obj.getAllFeedbacks(false).then(function(feeds) {
                var count = 0;
                var promises = [];
                angular.forEach(feeds.data, function(value, key) {
                    console.log(value.properties);
                    if (value.properties.ECASuniqueID == id) {
                        console.log('added to promises');
                        promises[count] = $http.get(CONFIG.server + CONFIG.path_rest + '/' + value._id);
                        count++;
                    }
                });
                if (count == 0) {
                    console.log('no reports!');
                    resolve(reparray);
                }
                $q.all(promises).then(function() {
                    console.log('All promises resolved');
                    angular.forEach(promises, function(value, key) {
                        reparray.push(value.$$state.value.data);
                    });
                    console.log('Reports service have:');
                    console.log(reparray);
                    console.log('serving array of reports');
                    resolve(reparray);
                });
            });

        });
    };
    */


    obj.getUserReports = function(id) {
        return $q(function(resolve, reject) {
            var reparray = [];
            obj.getOnlyUserFeedbacks(id).then(function(feeds) {
                /* scroll through every feedback to filter those near to our location */
                var count = 0;
                var promises = [];
                /* should retrieve pics in every item, create promises */
                angular.forEach(feeds.data, function(value, key) {
                    console.log(value.properties);
                    console.log('Added to promises');
                    promises[count] = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + value._id);
                    count++;
                });
                /* if there are no reports an empty array is served */
                if (count == 0) {
                    console.log('No reports!');
                    resolve(reparray);
                }
                /* when all promises are resolved scroll through them and get reports*/
                $q.all(promises).then(function() {
                    console.log('All promises resolved');
                    angular.forEach(promises, function(value, key) {
                        reparray.push(value.$$state.value.data);
                    });
                    console.log('Reports service have:');
                    console.log(reparray);
                    console.log('Serving array of reports');
                    resolve(reparray);
                });
            });

        });
    };
    
    obj.getUserCountReports = function(userID) {
        return $q(function(resolve, reject) {
        	var MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
    		var hashOAUTHID = (MD5(userID));
            var promises = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/count/' + hashOAUTHID);
            $q.all(promises).then(function() {
            	resolve(promises);
            });
        });
    }
    
    obj.getUserPagedReports = function(id, start, end) {
        return $q(function(resolve, reject) {
            var reparray = [];
            obj.getOnlyUserPagedFeedbacks(id, start, end).then(function(feeds) {
                /* scroll through every feedback to filter those near to our location */
                var count = 0;
                var promises = [];
                /* should retrieve pics in every item, create promises */
                angular.forEach(feeds.data, function(value, key) {
                    console.log(value.properties);
                    console.log('Added to promises');
                    promises[count] = $http.get(SERVER.serverApiUrl + CONFIG.path_rest + '/' + value._id);
                    count++;
                });
                /* if there are no reports an empty array is served */
                if (count == 0) {
                    console.log('No reports!');
                    resolve(reparray);
                }
                /* when all promises are resolved scroll through them and get reports*/
                $q.all(promises).then(function() {
                    console.log('All promises resolved');
                    angular.forEach(promises, function(value, key) {
                        reparray.push(value.$$state.value.data);
                    });
                    console.log('Reports service have:');
                    console.log(reparray);
                    console.log('Serving array of reports');
                    resolve(reparray);
                });
            });

        });
    };




    return obj;
})

/** $localstorage
 * Store Data in LocalStorage
 */
.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}])

.factory('$language', ['$localstorage', '$q', function($localstorage, $q) {
    var obj = {};

    // obj.availableLanguageKey = ["bg","es","cs","da","de","et","el","fr","ga","hr","it","lv","lt","hu","mt","nl","pl","pt","ro","sk","sl","fi","sv","en"];
    obj.availableLanguageKey = ["en", "de", "it", "fr","hu","ro"];

    obj.get = function() {
        var def = $q.defer();
        if ($localstorage.get('language') === undefined || $localstorage.get('language') === 'undefined' || $localstorage.get('language') === '') {
            ionic.Platform.ready(function() {
                navigator.globalization.getPreferredLanguage(function(result) {
                        var languageCode = result.value.slice(0, 2);
                        if (obj.availableLanguageKey.indexOf(languageCode) != -1) {
                            obj.set(languageCode);
                        } else {
                            obj.set("en");
                        }
                        def.resolve($localstorage.get('language'));
                    },
                    function(error) {
                        obj.set("en"); // default to en
                        def.resolve($localstorage.get('language'));
                    });
            });
        } else {
            def.resolve($localstorage.get('language'));
        }
        //obj.set("en");
        return def.promise;
    };
    obj.set = function(language) {
        $localstorage.set('language', language);
    };

    obj.test = function() {
        //alert('mpmpmpmpm');
    };

    return obj;
}]);
