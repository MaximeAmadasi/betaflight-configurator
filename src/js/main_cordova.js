'use strict';

const REQUIRED_WEBVIEW_VERSION = 72;
const WEBVIEW = {
    chromeVersion: '',
    majorChromeVersion: 0,
    appsId: {
        androidWebview: 'com.android.webview',
        googleWebview: 'com.google.android.webview',
        chrome: 'com.android.chrome',
    },
    apps: {
        'com.android.webview': { },
        'com.google.android.webview': {
            name: 'Android System WebView',
            displayName: 'Google Android Webview',
        },
        'com.android.chrome': {
            name: 'Google Chrome',
            displayName: 'Chrome',
        },
    },
    matchingVersion: 0,
    usedApp: null,
    uptodateApps: [],
    htmlElements: {
        webview_step_msg: '#webview_step_msg',
        webview_step_btn1: '#webview_step_btn1',
        webview_step_btn2: '#webview_step_btn2',
    },
    advices: {
        installGoogleAndroidWebview: function(callback) {
            $(WEBVIEW.htmlElements.webview_step_msg).html(i18n.getMessage('cordovaWebviewInstall', {
                app: WEBVIEW.apps[WEBVIEW.appsId.googleWebview].name,
            }));
            $('#webview_step_btn1').text(i18n.getMessage('cordovaWebviewInstallBtn'))
                .attr('app_id', WEBVIEW.appsId.googleWebview);
            callback();
        },
        updateGoogleAndroidWebview: function(callback) {
            $(WEBVIEW.htmlElements.webview_step_msg).html(i18n.getMessage('cordovaWebviewUpdate', {
                app: WEBVIEW.apps[WEBVIEW.appsId.googleWebview].name,
            }));
            $(WEBVIEW.htmlElements.webview_step_btn1).text(i18n.getMessage('cordovaWebviewUpdateBtn'))
                .attr('app_id', WEBVIEW.appsId.googleWebview);
            callback();
        },
        updateAndroidChrome: function(callback) {
            $(WEBVIEW.htmlElements.webview_step_msg).html(i18n.getMessage('cordovaWebviewUpdate', {
                app: WEBVIEW.apps[WEBVIEW.appsId.chrome].name,
            }));
            $(WEBVIEW.htmlElements.webview_step_btn1).text(i18n.getMessage('cordovaWebviewUpdateBtn'))
                .attr('app_id', WEBVIEW.appsId.chrome);
            callback();
        },
        uninstallGoogleAndroidWebview: function(callback) {
            $(WEBVIEW.htmlElements.webview_step_msg).html(i18n.getMessage('cordovaWebviewUninstall', {
                app: WEBVIEW.apps[WEBVIEW.appsId.googleWebview].name,
            }));
            $(WEBVIEW.htmlElements.webview_step_btn1).text(i18n.getMessage('cordovaWebviewUninstallBtn1'))
                .attr('app_id', WEBVIEW.appsId.googleWebview);
            $(WEBVIEW.htmlElements.webview_step_btn2).text(i18n.getMessage('cordovaWebviewUninstallBtn2'))
                .attr('app_id', WEBVIEW.appsId.googleWebview)
                .show();
            callback();
        },
        selectWebview: function(id, callback) {
            let app;
            if (id === WEBVIEW.appsId.googleWebview) {
                app = WEBVIEW.apps[WEBVIEW.appsId.googleWebview].displayName;
            } else if (id === WEBVIEW.appsId.chrome) {
                app = WEBVIEW.apps[WEBVIEW.appsId.chrome].displayName;
            }
            $(WEBVIEW.htmlElements.webview_step_msg).html(i18n.getMessage('cordovaWebviewEnable', {
                app: app,
            }));
            $(WEBVIEW.htmlElements.webview_step_btn1).hide();
            $(WEBVIEW.htmlElements.webview_step_btn2).text(i18n.getMessage('cordovaWebviewEnableBtn')).show();
            callback();
        },
    },
    getAdvice1: function(callback) {
        const self = this;
        if (self.usedApp === WEBVIEW.appsId.googleWebview) {
            self.advices.updateGoogleAndroidWebview(callback);
        } else if (self.usedApp === WEBVIEW.appsId.chrome) {
            self.advices.updateAndroidChrome(callback);
        }
    },
    getAdvice2: function(callback) {
        const self = this;
        if (self.uptodateApps.length > 0) {
            self.advices.selectWebview(callback);
        } else {
            if ((self.apps[WEBVIEW.appsId.googleWebview].installed && self.apps[WEBVIEW.appsId.googleWebview].enabled)
                && (self.apps[WEBVIEW.appsId.chrome].installed && self.apps[WEBVIEW.appsId.chrome].enabled)) {
                self.advices.uninstallGoogleAndroidWebview(callback);
            } else if (!(self.apps[WEBVIEW.appsId.googleWebview].installed && self.apps[WEBVIEW.appsId.googleWebview].enabled)
                && !(self.apps[WEBVIEW.appsId.chrome].installed && self.apps[WEBVIEW.appsId.chrome].enabled)) {
                self.advices.installGoogleAndroidWebview(callback);
            } else {
                self.getAdvice3(callback);
            }
        }
    },
    getAdvice3: function(callback) {
        const self = this;
        if (self.apps[WEBVIEW.appsId.googleWebview].installed && self.apps[WEBVIEW.appsId.googleWebview].enabled
            && !self.apps[WEBVIEW.appsId.googleWebview].uptodate) {
            self.advices.updateGoogleAndroidWebview(callback);
        } else if (self.apps[WEBVIEW.appsId.chrome].installed && self.apps[WEBVIEW.appsId.chrome].enabled
            && !self.apps[WEBVIEW.appsId.chrome].uptodate) {
            self.advices.updateAndroidChrome(callback);
        }
    },
    getAdvice: function(callback) {
        const self = this;
        if (self.usedApp && self.usedApp !== WEBVIEW.appsId.androidWebview) {
            this.getAdvice1(callback);
        } else {
            this.getAdvice2(callback);
        }
    },
    tryToFindUsedApp: function(callback) {
        const self = this;
        const appsId = Object.keys(self.apps);
        for (let i=0; i<appsId.length; i++) {
            const id = appsId[i];
            if (self.matchingVersion === 1 && self.apps[id].used === 'could') {
                self.apps[id].used = 'yes';
                self.usedApp = id;
                $(`li[app_id='${id}']`).append(` (<span style="color: green">${i18n.getMessage('cordovaWebviewUsed')}</span>)`);
            }
            if (i === appsId.length-1) {
                callback();
            }
        }
    },
    checkInstalledApps: function(callback) {
        const self = this;
        const appsId = Object.keys(self.apps);
        let installedApps = 0;

        function checkAvailability(id, i) {
            appAvailability.check(id, function(info) {
                appInstalled(info, id, i);
            }, function() {
                appNotInstalled(id, i);
            });
        }
        function end(i) {
            if (i === appsId.length-1) {
                if (installedApps === 0) {
                    $('#webview_apps').append('<li i18n="cordovaNoWebview" style="color: red"></li>');
                }
                i18n.localizePage();
                console.log('callback');
                callback();
            }
        }
        function appInstalled(info, id, i) {
            installedApps++;
            self.apps[id].installed = true;
            self.apps[id].enabled = info.enabled;
            self.apps[id].version = info.version;
            self.apps[id].majorVersion = parseInt(info.version.split('.')[0]);
            if (self.chromeVersion === self.apps[id].version) {
                self.apps[id].used = 'could';
                self.matchingVersion++;
            } else {
                self.apps[id].used = 'no';
            }
            let color;
            if (self.apps[id].majorVersion >= REQUIRED_WEBVIEW_VERSION) {
                color = 'green';
                self.apps[id].uptodate = true;
                self.uptodateApps.push(id);
            } else {
                color = 'red';
                self.apps[id].uptodate = false;
            }
            let app = `<li app_id="${id}">${id} (<span style="color: ${color}">${self.apps[id].version}</span>)`;
            if (!self.apps[id].enabled) {
                app += ' (<span i18n="portsTelemetryDisabled"></span>)';
            }
            app += '</li>';
            $('#webview_apps').append(app);
            end(i);
        }
        function appNotInstalled(id, i) {
            self.apps[id].installed = false;
            end(i);
        }

        for (let i=0; i<appsId.length; i++) {
            const id = appsId[i];
            checkAvailability(id, i);
        }
    },
    exec: function(callback) {
        const self = this;
        self.chromeVersion = window.navigator.appVersion.replace(/.*Chrome\/([0-9.]*).*/, "$1");
        self.majorChromeVersion = self.chromeVersion.split('.')[0];
        if (self.majorChromeVersion >= REQUIRED_WEBVIEW_VERSION) {
            callback();
        } else {
            navigator.splashscreen.hide();
            self.checkInstalledApps(function() {
                self.tryToFindUsedApp(function() {
                    self.getAdvice(function() {
                        $('#loading').hide();
                        $('#webview_troubleshooting').show();
                    });
                });
            });
        }
    },
};

const REQUIRED_PERMISSIONS = [
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.ACCESS_COARSE_LOCATION',
];
const PERMISSIONS = {
    unauthorizedPermissions: [],
    check: function(callback) {
        const self = this;
        window.plugins.Permission.has(REQUIRED_PERMISSIONS, function(results) {
            console.log(results);
            for (let i=0; i<REQUIRED_PERMISSIONS.length; i++) {
                if (!results[REQUIRED_PERMISSIONS[i]]) {
                    self.unauthorizedPermissions.push(REQUIRED_PERMISSIONS[i]);
                }
                if (i === REQUIRED_PERMISSIONS.length-1) {
                    if (self.unauthorizedPermissions.length > 0) {
                        console.log(self.unauthorizedPermissions);
                        self.request(callback);
                    } else {
                        callback();
                    }
                }
            }
        }, function() {
            console.log('error when checking permissions');
        });
    },
    request: function(callback) {
        const self = this;
        window.plugins.Permission.request(self.unauthorizedPermissions, function(results) {
            console.log(results);
            const finalUnauthorizedPermissions = [];
            for (let i=0; i<self.unauthorizedPermissions.length; i++) {
                if (!results[self.unauthorizedPermissions[i]]) {
                    finalUnauthorizedPermissions.push(self.unauthorizedPermissions[i]);
                }
                if (i === self.unauthorizedPermissions.length-1) {
                    if (finalUnauthorizedPermissions.length > 0) {
                        self.unauthorizedPermissions = finalUnauthorizedPermissions;
                        self.rerequest();
                    } else {
                        self.unauthorizedPermissions = [];
                        callback();
                    }
                }
            }
        }, alert)
    },
    rerequest: function() {
        $('#permissions').show();
        $('#loading').hide();
        navigator.splashscreen.hide();
    },
};


const cordovaApp = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        $('#webview_troubleshooting').hide();
        $('#permissions').hide();
        $('#loading').show();
        i18n.init(function() {
            i18n.localizePage();
            $('p[i18n="cordovaCheckingPermission"]').hide();
            WEBVIEW.exec(function() {
                $('p[i18n="cordovaCheckingWebview"]').hide();
                $('p[i18n="cordovaCheckingPermission"]').show();
                PERMISSIONS.check(function() {
                    document.location.href = 'main.html';
                });
            });
        });
    },
};
cordovaApp.initialize();

$(WEBVIEW.htmlElements.webview_step_btn1).on('click', function() {
    const appId = $(WEBVIEW.htmlElements.webview_step_btn1).attr('app_id');
    cordova.plugins.market.open(appId);
});
$(WEBVIEW.htmlElements.webview_step_btn2).on('click', function() {
    if ($(WEBVIEW.htmlElements.webview_step_btn2).attr('app_id') !== undefined) {
        const appId = $(WEBVIEW.htmlElements.webview_step_btn2).attr('app_id');
        window.cordova.plugins.settings.open(['application_details', false, appId]);
    } else {
        window.cordova.plugins.settings.open('settings');
    }
});
$('#permissions_btn').on('click', function() {
    $('#permissions').hide();
    $('#loading').show();
    PERMISSIONS.check(function() {
        document.location.href = 'main.html';
    });
});
