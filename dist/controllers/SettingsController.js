"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const SettingsService_1 = require("../services/SettingsService");
class SettingsController {
    static async getSetting(req, res) {
        try {
            const setting = await SettingsService_1.SettingsService.getSetting(req.params.key);
            if (!setting) {
                return res.json({ key: req.params.key, value: null });
            }
            res.json(setting);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
    static async setSetting(req, res) {
        try {
            const { value, version } = req.body;
            if (value === undefined) {
                return res.status(400).json({ error: 'value is required' });
            }
            const updated = await SettingsService_1.SettingsService.setSetting(req.params.key, value, version);
            res.json(updated);
        }
        catch (err) {
            console.error(err);
            if (err.message.includes('409')) {
                return res.status(409).json({ error: 'Conflict: Setting was modified by another device. Please refresh.' });
            }
            res.status(500).json({ error: err.message });
        }
    }
}
exports.SettingsController = SettingsController;
