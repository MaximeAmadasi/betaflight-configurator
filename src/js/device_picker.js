'use strict';

const devicePicker = {
    devices: [],
    ports: [],
    dfuState: false,
    bluetoothDevices: [],

    updateButtons: function() {
        const self = this;
        if (!GUI.advanced_connection) {
            if (self.devices.length === 0) {
                $('.connect_b a.connect, .firmware_b a.flash').addClass('disabled');
            } else {
                const selectedDevice = $('div#port-picker #device option:selected');
                if (selectedDevice.attr('type') === 'dfu') {
                    $('.connect_b a.connect').addClass('disabled');
                    $('.firmware_b a.flash').removeClass('disabled');
                } else if (selectedDevice.attr('type') === 'bluetooth') {
                    $('.firmware_b a.flash').addClass('disabled');
                    $('.connect_b a.connect').removeClass('disabled');
                } else {
                    $('.connect_b a.connect, .firmware_b a.flash').removeClass('disabled');
                }
            }
        }
    },
    enable: function() {
        const self = this;
        $('input.advanced_connection, span.advanced_connection').prop('title', i18n.getMessage('advancedConnectionDisabled'));
        $('#portPicker, #baudPicker').hide();
        $('#devicePicker').show();
        self.updateButtons();
    },
    disable: function() {
        $('input.advanced_connection, span.advanced_connection').prop('title', i18n.getMessage('advancedConnectionEnabled'));
        $('#portPicker, #baudPicker').show();
        $('#devicePicker').hide();
        $('.connect_b a.connect, .firmware_b a.flash').removeClass('disabled');
    },
    init: function() {
        const self = this;
        $('div#port-picker #device').change(function() {
            self.updateButtons();
            self.updateConnection();
        });
        self.toogle();
    },
    toogle: function() {
        const self = this;
        if (GUI.advanced_connection) {
            self.disable();
        } else {
            self.enable();
        }
    },

    updateDevices: function() {
        const self = this;
        const oldDevices = self.devices;
        self.devices = self.ports.concat(self.bluetoothDevices);
        if (self.dfuState) {
            self.devices.push({
                type: 'dfu',
                displayName: 'DFU',
                path: 'DFU',
            });
        }
        const devicePickerElement = $("div#port-picker #device");
        devicePickerElement.empty();
        if (self.devices.length === 0) {
            devicePickerElement.append('<option i18n="devicePickerNoAvailable" value="nodeviceavailable"></option>');
            i18n.localizePage();
            $('div#port-picker #device').trigger('change');
        } else {
            for (let i=0; i<self.devices.length; i++) {
                devicePickerElement.append(`<option value="${self.devices[i].path}" type="${self.devices[i].type}">${self.devices[i].displayName}</option>`)
                if (i === self.devices.length-1) {
                    $('div#port-picker #device').trigger('change');
                }
            }
        }
    },
    updateAvailablePorts: function(ports) {
        const self = this;
        self.ports = [];
        if (ports.length > 0) {
            for (let i=0; i<ports.length; i++) {
                ports[i].type = 'serial';
                self.ports.push(ports[i]);
                if (i === ports.length-1) {
                    self.updateDevices();
                }
            }
        } else {
            self.updateDevices();
        }
    },
    updateAvailableDfu: function(state) {
        const self = this;
        self.dfuState = state;
        self.updateDevices();
    },
    updateAvailableBluetoothDevices: function() {
        const self = this;
        self.updateDevices();
    },

    updateConnection: function() {
        const selectedDevice = $('div#port-picker #device option:selected');
        if (selectedDevice.val() !== 'noavailabledevice' && (selectedDevice.attr('type') === 'serial' || selectedDevice.attr('type') === 'dfu')) {
            $(`div#port-picker #port option[value="${selectedDevice.val()}"]`).prop('selected', true);
        }
    },
};
