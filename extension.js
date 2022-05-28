/*
    Hot Bottom - GNOME Shell 40+ extension
    Copyright Francois Thirioux
    GitHub contributors: @fthx
    License GPL v3
*/

const { GLib, GObject, St } = imports.gi;

const Main = imports.ui.main;

var SHOW_BOX_HEIGHT = 2;
var SHOW_BOX_HOVER_DELAY = 100;


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

class Extension {
    constructor() {
    }

    _show_box_refresh() {
        this.work_area = Main.layoutManager.getWorkAreaForMonitor(Main.layoutManager.primaryIndex);
        if (!this.work_area) {
            return;
        }

        this.show_box.set_size(Main.overview.dash._dashContainer.width, SHOW_BOX_HEIGHT);
        this.show_box_x = this.work_area.x + Math.round((this.work_area.width - Main.overview.dash._dashContainer.width) / 2);
        this.show_box_y = this.work_area.y + this.work_area.height - SHOW_BOX_HEIGHT;
        this.show_box.set_position(this.show_box_x, this.show_box_y);
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
        this.show_box = new ShowBox();
        this._show_box_refresh();

        this.show_box.connect('notify::hover', this._on_show_box_hover.bind(this));
        this.workareas_changed = global.display.connect_after('workareas-changed', this._show_box_refresh.bind(this));
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
    }
}

function init() {
    return new Extension();
}
