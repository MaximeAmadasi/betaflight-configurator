'use strict';

const bluetooth = {
    devicesServicesAndCharacteristics: [{
        service: '1000',
        readCharacteristic: '1002',
        writeCharacteristic: '1001',
    }, {
        service: 'ffe0',
        readCharacteristic: 'ffe1',
        writeCharacteristic: 'ffe1',
    }],

    available: false,
    serviceUuid: null,
    readCharacteristicUuid: null,
    listenCharacteristicUuid: null,
    selectDeviceCallback: null,

    init: function() {
        const self = this;
        $('.dialogBluetooth-closebtn').click(function() {
            self.closeModal();
            if (self.selectDeviceCallback) {
                self.selectDeviceCallback(false);
                self.selectDeviceCallback = null;
            }
        });
        $('.dialogBluetooth-refreshbtn').click(function() {
            self.selectDevice();
        });
        if (GUI.isCordova()) {
            self._configureAsCordova();
        }
    },
    platformSpecificInit: null,
    connect: null,
    disconnect: null,
    getDevices: null,
    selectDevice: function(callback) {
        const self = this;
        if (callback) {
            self.selectDeviceCallback = callback;
        }
        $('.dialogBluetooth h3, .dialogBluetooth .content, .dialogBluetooth .buttons').hide();
        $('.dialogBluetooth .dialogBluetooth-loader').show();
        const dialogBluetooth = $('.dialogBluetooth')[0];
        if (!$('.dialogBluetooth').is(':visible')) {
            dialogBluetooth.showModal();
        }

        function end() {
            $('.dialogBluetooth h3, .dialogBluetooth .content, .dialogBluetooth .buttons').show();
            $('.dialogBluetooth .dialogBluetooth-loader').hide();
        }

        self.getDevices(function(devices) {
            $('.dialogBluetooth .dialogBluetooth-content').empty();
            if (devices.length === 0) {
                $('.dialogBluetooth .dialogBluetooth-content').append('<div>No available device</div>');
                end();
            } else {
                for (let i=0; i<devices.length; i++) {
                    $('.dialogBluetooth .dialogBluetooth-content').append(`<div onclick="bluetooth.finishSelectDevice('${devices[i].id}')">${devices[i].name}</div>`);
                    if (i === devices.length-1) {
                        end();
                    }
                }
            }

        });
    },
    finishSelectDevice: function(id) {
        const self = this;
        if (self.selectDeviceCallback) {
            self.selectDeviceCallback(id);
            self.selectDeviceCallback = null;
        }
        $('.dialogBluetooth h3, .dialogBluetooth .content, .dialogBluetooth .buttons').hide();
        $('.dialogBluetooth .dialogBluetooth-loader').show();
        self.closeModal();
    },
    closeModal: function() {
        const dialogBluetooth = $('.dialogBluetooth')[0];
        dialogBluetooth.close();
    },
    getInfo: null,
    send: null,
    onReceive: {
        listeners: [],
        addListener: function(functionReference) {
            this.listeners.push(functionReference);
        },
        removeListener: async function(functionReference) {
            this.listeners = await removeItemOfAnArray(this.listeners, functionReference);
        },
        receiveData: function(data) {
            if (data.byteLength > 0) {
                for (let i = (this.listeners.length - 1); i >= 0; i--) {
                    this.listeners[i]({
                        data,
                    });
                }
            }
        },
    },
    onReceiveError: {
        listeners: [],
        addListener: function(functionReference) {
            this.listeners.push(functionReference);
        },
        removeListener: async function(functionReference) {
            this.listeners = await removeItemOfAnArray(this.listeners, functionReference);
        },
        receiveError: function(error) {
            for (let i = (this.listeners.length - 1); i >= 0; i--) {
                this.listeners[i](error);
            }
        },
    },
};

bluetooth._configureAsCordova = function() {
    this.platformSpecificInit = function(callback) {
        const self = this;
        callback();
    };

    this.connect = function(id, callback) {
        const self = this;
        ble.connect(id, function(device) {
            self.devicesInfo = device;
            if (device.characteristics.length === 0) {
                console.log('no bluetooth characteristics');
                self.disconnect(id, function() {
                    callback(false);
                });
            } else {
                function setMtu() {
                    ble.requestMtu(id, 512, function() {
                        setPriority();
                    }, function(err) {
                        console.log('requestMtu failed');
                        console.log(err);
                        self.disconnect(id, function() {
                            callback(false);
                        });
                    });
                }
                function setPriority() {
                    ble.requestConnectionPriority(id, 'high', function() {
                        finish();
                    }, function(err) {
                        console.log('requestConnectionPriority failed');
                        console.log(err);
                        self.disconnect(id, function() {
                            callback(false);
                        });
                    });
                }
                function finish() {
                    if (self.serviceUuid && self.writeCharacteristicUuid && self.readCharacteristicUuid) {
                        ble.startNotification(id, self.serviceUuid, self.readCharacteristicUuid, function(data) {
                            self.onReceive.receiveData(data);
                        }, function(err) {
                            console.log('startNotification error');
                            console.log(err);
                            self.onReceiveError.receiveError({
                                error: 'undefined',
                                source: 'startNotification',
                            });
                        });
                        callback(device);
                    } else {
                        console.log('no service or no characterictics');
                        self.disconnect(id, function() {
                            callback(false);
                        });
                    }
                }

                let i = 0;
                function checkService() {
                    if (device.services.indexOf(self.devicesServicesAndCharacteristics[i].service) !== -1) {
                        self.serviceUuid = self.devicesServicesAndCharacteristics[i].service;
                        let foundCharacteristics = 0;
                        for (let j=0; j<device.characteristics.length; j++) {
                            if (device.characteristics[j].characteristic === self.devicesServicesAndCharacteristics[i].readCharacteristic ||
                                device.characteristics[j].characteristic === self.devicesServicesAndCharacteristics[i].writeCharacteristic) {
                                foundCharacteristics++
                            }
                            if (j === device.characteristics.length-1) {
                                if (foundCharacteristics === 2) {
                                    self.writeCharacteristicUuid = self.devicesServicesAndCharacteristics[i].writeCharacteristic;
                                    self.readCharacteristicUuid = self.devicesServicesAndCharacteristics[i].readCharacteristic;
                                    setMtu();
                                } else {
                                    if (i === self.devicesServicesAndCharacteristics-1) {
                                        finish();
                                    } else {
                                        i++;
                                        checkService();
                                    }
                                }
                            }
                        }
                    }
                }
                checkService();
            }

        }, function(err) {
            console.log('connect error');
            console.log(err);
            if (!serial.connected) {
                callback(false);
            }
        });
    };

    this.disconnect = function(id, callback) {
        const self = bluetooth;
        ble.stopNotification();
        ble.disconnect(id, function(success) {
            self.devicesInfo = null;
            callback(success);
        }, function(err) {
            console.log('disconnect error');
            console.log(err);
            if (serial.connected) {
                callback(false);
            }
        })
    };

    this.getDevices = function(callback) {
        const self = this;
        self.devices = [];
        ble.scan([], 5, function(device) {
            if (device.name === undefined) {
                device.name = device.id;
            }
            self.devices.push(device);
        });
        setTimeout(function() {
            callback(self.devices);
        }, 5000);
    };

    this.getInfo = function(id, callback) {
        const self = this;
        callback(self.devicesInfo);
    };

    this.send = function(id, data, callback) {
        const self = bluetooth;
        ble.writeWithoutResponse(id, self.serviceUuid, self.writeCharacteristicUuid, data, function(success) {
            callback({
                bytesSend: data.byteLength,
            });
        }, function(err) {
            console.log('writeWithoutResponse error');
            console.log(err);
            self.onReceiveError.receiveError({
                error: 'undefined',
                source: 'writeWithoutResponse',
            });
        });
    };

    this.available = true;
    this.devices = [];
    this.devicesInfo = null;
    this.platformSpecificInit(function() {
        devicePicker.updateAvailableBluetooth(true);
    });
};
