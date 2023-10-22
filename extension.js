/*
    Hot Bottom
    GNOME Shell 45+ extension
    Copyright @fthx 2023
*/

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';


var SHOW_BOX_HEIGHT = 2;
var SHOW_BOX_HOVER_DELAY = 150;

var ShowBox = GObject.registerClass(
class ShowBox extends St.BoxLayout {
    _init() {
        super._init();
        Main.layoutManager.addTopChrome(this);
        this.set_reactive(true);
        this.set_track_hover(true);
        this.show();
    }
});

export default class HotBottomExtension {
    constructor() {
        this.panel_height = Main.panel.get_height();
    }

    _show_panel() {
        Main.panel.set_height(this.panel_height);
    }

    _hide_panel() {
        Main.panel.set_height(0);
    }

    _show_box_refresh() {
        this.work_area = Main.layoutManager.getWorkAreaForMonitor(Main.layoutManager.primaryIndex);
        if (!this.work_area) {
            return;
        }

        this.show_box.set_size(this.work_area.width, SHOW_BOX_HEIGHT);
        this.show_box.set_position(this.work_area.x, this.work_area.y + this.work_area.height - SHOW_BOX_HEIGHT);
    }

    _on_show_box_hover() {
        if (Main.sessionMode.isLocked || Main.overview.animationInProgress) {
            return;
        }

        this.show_box_hover_timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SHOW_BOX_HOVER_DELAY, () => {
            if (this.show_box.get_hover()) {
                Main.overview.toggle();
            }
            this.show_box_hover_timeout = 0;
            return false;
        });
    }

    enable() {
        this._hide_panel();
        this.showing = Main.overview.connect('showing', this._show_panel.bind(this));
        this.hiding = Main.overview.connect('hiding', this._hide_panel.bind(this));

        this.show_box = new ShowBox();
        this._show_box_refresh();

        this.show_box.connect('notify::hover', this._on_show_box_hover.bind(this));
        this.workareas_changed = global.display.connect('workareas-changed', this._show_box_refresh.bind(this));
    }

    disable() {
        if (this.show_box_hover_timeout) {
            GLib.source_remove(this.show_box_hover_timeout);
            this.show_box_hover_timeout = 0;
        }

        if (this.workareas_changed) {
            global.display.disconnect(this.workareas_changed);
            this.workareas_changed = null;
        }

        Main.layoutManager.removeChrome(this.show_box);
        this.show_box.destroy();
        this.show_box = null;

        Main.overview.disconnect(this.showing);
        Main.overview.disconnect(this.hiding);
        this._show_panel();
    }
}
