// UTILITIES
function levenshtein(a, b) {
    const m = Array.from({length: a.length + 1}, (_, i) =>
        Array.from({length: b.length + 1}, (_, j) => i || j));
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            m[i][j] = Math.min(
                m[i-1][j] + 1,
                m[i][j-1] + 1,
                m[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0));
    return m[a.length][b.length];
}

function fuzzy_match(input, options, threshold) {
    if (!input) return '';
    threshold = threshold || 3;
    input = input.toLowerCase().trim();
    const exact = options.find(o => o.toLowerCase() === input);
    if (exact) return exact;
    let best = null, best_dist = Infinity;
    for (const opt of options) {
        const d = levenshtein(input, opt.toLowerCase());
        if (d < best_dist) { best_dist = d; best = opt; }
    }
    return best_dist <= threshold ? best : '';
}

//fuzzy match + alias variant
function fuzzy_match_alias(input, aliases) {
    if (!input) return '';
    input = input.toLowerCase().trim();
    if (aliases[input]) return aliases[input];
    let best_val = null, best_dist = Infinity;
    for (const k of Object.keys(aliases)) {
        const d = levenshtein(input, k);
        if (d < best_dist) { best_dist = d; best_val = aliases[k]; }
    }
    return best_dist <= 3 ? best_val : '';
}

//update textarea field line without triggering events
function update_textarea_field(textareaId, fieldNames, value) {
    const ta = document.getElementById(textareaId);
    if (!ta || !ta.value.trim()) return;
    const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
    const pattern = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`^(\\*?\\s*(?:${pattern})\\s*:).*$`, 'im');
    if (regex.test(ta.value)) {
        ta.value = ta.value.replace(regex, value ? `$1 ${value}` : `$1`);
    } else if (value) {
        ta.value = ta.value.trimEnd() + `\n${names[0]}: ${value}`;
    }
}

//skill name matching with alias fallback
function match_skill(input) {
    if (!input) return '';
    const lower = input.toLowerCase().trim();
    //exact skill names
    for (const skill of Object.keys(FT.skills)) {
        if (skill.toLowerCase() === lower) return skill;
    }
    //exact aliases
    if (FT.skill_aliases[lower]) return FT.skill_aliases[lower];
    //fuzzy fallback
    let best_val = null, best_dist = Infinity;
    for (const skill of Object.keys(FT.skills)) {
        const d = levenshtein(lower, skill.toLowerCase());
        if (d < best_dist) { best_dist = d; best_val = skill; }
    }
    for (const [k, v] of Object.entries(FT.skill_aliases)) {
        const d = levenshtein(lower, k);
        if (d < best_dist) { best_dist = d; best_val = v; }
    }
    return best_dist <= 3 ? best_val : '';
}

function is_placeholder(val) {
    return FT.placeholder_patterns.test(val.trim());
}

//non-stat specialty keys
const _spec_skip = ['requires', 'forms', 'reminder', 'cmd', 'effect', 'AURA_TOTAL'];

function spec_has_form(spec, form) {
    const cfg = FT.specialties[spec];
    if (!cfg || cfg === 'passive') return false;
    return cfg.forms && cfg.forms.includes(form);
}

//skill level value lookup
function skill_value(skill, level) {
    const cfg = FT.skills[skill];
    if (!cfg) return undefined;
    if (typeof cfg === 'string') return FT.skill_levels[level];
    if (cfg.overrides && cfg.overrides[level] !== undefined) return cfg.overrides[level];
    return FT.skill_levels[level];
}

function skill_stat(skill) {
    const cfg = FT.skills[skill];
    return typeof cfg === 'string' ? cfg : cfg && cfg.stat;
}

//clean field values
function clean_val(str) {
    return str.replace(/^[;:\/\\|=\->\s]+/, '').trim();
}

//wrong-tab detection
function detect_wrong_tab(raw, currentTab, alerts) {
    const lower = raw.toLowerCase();
    if (currentTab !== 'fight') {
        const fight_fields = [];
        if (/companion\s*\d/i.test(lower)) fight_fields.push('Companions');
        if (/mutation\s*\d/i.test(lower)) fight_fields.push('Mutations');
        if (/offensive\s*battle/i.test(lower)) fight_fields.push('Offensive Accessory');
        if (/defensive\s*battle/i.test(lower)) fight_fields.push('Defensive Accessory');
        if (/disability/i.test(lower)) fight_fields.push('Disability');
        if (/debuff/i.test(lower)) fight_fields.push('Debuff');
        if (fight_fields.length) {
            alerts.push({ msg: `Found fight fields (${fight_fields.join(', ')}). Double check this is the right form.`, level: 'warn' });
            return true;
        }
    }
    return false;
}

//duplicate form detection
function detect_duplicate_form(raw, alerts) {
    const lower = raw.toLowerCase();
    const dupes = [];
    for (const field of ['skills:', 'size:', 'build:']) {
        const count = lower.split(field).length - 1;
        if (count > 1) dupes.push(field.replace(':', ''));
    }
    if (dupes.length) {
        alerts.push({ msg: `Duplicate form detected (${dupes.join(', ')} appears more than once).`, level: 'err' });
        return true;
    }
    return false;
}

function render_alerts_box(boxId, alerts, typos) {
    const box = document.getElementById(boxId);
    let html = '';
    const visible = alerts.filter(a => !a._hidden);
    const reminders = visible.filter(a => a._reminder);
    const main = visible.filter(a => !a._reminder);
    //sort by severity
    const sorted = [...main].sort((a, b) => {
        const rank = x => x.level === 'err' ? 0 : x.msg.startsWith('Unfilled') ? 2 : x.level === 'info' ? 2 : 1;
        return rank(a) - rank(b);
    });
    if (sorted.length) {
        html += '<div class="ft_alert"><strong>Alerts</strong>';
        html += sorted.map(a => `<p>• ${a.msg}</p>`).join('');
        html += '</div>';
    }
    if (reminders.length) {
        html += '<div class="ft_alert"><strong>Reminders</strong>';
        html += reminders.map(a => `<p>• ${a.msg}</p>`).join('');
        html += '</div>';
    }
    if (typos.length) {
        html += '<div class="ft_alert"><strong>Typos fixed (hopefully)</strong>';
        html += typos.map(t => `<p>• ${t}</p>`).join('');
        html += '</div>';
    }
    if (!visible.length && !typos.length) {
        html = '<div class="ft_alert"><strong>All fields parsed.</strong></div>';
    }
    box.innerHTML = html;
    box.hidden = false;
}

//item matching: exact label then alias
function auto_match_items(text, aliases, selector) {
    const lower = text.toLowerCase();
    let matched = false;
    const bases = selector.split(',').map(s => s.trim());
    function find_cb(key) {
        const query = bases.map(s => `${s} input[value="${key}"]`).join(', ');
        return document.querySelector(query);
    }
    //exact labels
    const all_cbs = bases.flatMap(s => [...document.querySelectorAll(`${s} input[type="checkbox"]`)]);
    for (const cb of all_cbs) {
        if (lower.includes(cb.value.toLowerCase())) {
            cb.checked = true; matched = true;
        }
    }
    if (matched) return matched;
    //alias fallback
    for (const [phrase, key] of Object.entries(aliases)) {
        if (lower.includes(phrase)) {
            const cb = find_cb(key);
            if (cb) { cb.checked = true; matched = true; }
        }
    }
    return matched;
}

//item checkbox builder with note fields
function build_item_html(items, containerId) {
    let checkboxes = items.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');
    const specials = items.filter(i => i.type === 'special');
    if (specials.length) {
        checkboxes += `<div class="ft_item_notes" id="${containerId}_notes" style="width:100%">`;
        checkboxes += specials.map(i =>
            `<div class="ft_bard_name_wrap ft_item_note_wrap" data-item="${i.label}" hidden>` +
            `<input type="text" class="ft_bard_name ft_item_note" placeholder="${i.label} note..." data-item="${i.label}">` +
            `</div>`
        ).join('');
        checkboxes += `</div>`;
    }
    return checkboxes;
}

//item display label with note
function get_item_display(label, listId) {
    const note_input = document.querySelector(`#${listId} .ft_item_note[data-item="${label}"]`);
    if (note_input && note_input.value.trim()) {
        return `${label} (${note_input.value.trim()})`;
    }
    return label;
}

function validate_spec_skills(specs, skills, alerts) {
    (specs || []).forEach(spec => {
        const req = (FT.specialties[spec] || {}).requires;
        if (!req) return;
        const level = skills[req];
        if (!level) {
            alerts.push({ msg: `"${spec}" requires ${req} skill.`, level: 'err' });
        } else if (level !== 'Master') {
            alerts.push({ msg: `"${spec}" usually needs Master ${req} (has ${level}).`, level: 'warn' });
        }
    });
}

//error summary for output box
function render_issues(alerts, outputId) {
    if (!alerts.some(a => a.level === 'err')) return false;
    const issues = new Set();
    alerts.filter(a => a.level === 'err').forEach(a => {
        const m = a.msg.toLowerCase();
        if (m.includes('duplicate')) issues.add('duplicate form');
        else if (m.includes('age')) issues.add('age');
        else if (m.includes('size')) issues.add('size');
        else if (m.includes('build')) issues.add('build');
        else if (m.includes('skill')) issues.add('skills');
        else if (m.includes('special')) issues.add('specialties');
        else if (m.includes('companion')) issues.add('companions');
        else if (m.includes('mutation')) issues.add('mutations');
        else if (m.includes('accessor')) issues.add('accessories');
        else if (m.includes('too many item')) issues.add('items');
        else issues.add('form');
    });
    const box = document.getElementById(outputId);
    box.innerHTML = `<div class="ft_alert"><strong>Issues found:</strong> ${[...issues].join(', ')}</div>`;
    box.hidden = false;
    return true;
}

function format_skills_text(skills, sep) {
    return Object.entries(skills).map(([k,v]) => v + ' ' + (FT.skill_display[k] || k)).join(sep || ', ');
}


function auto_select_items(text) {
    return auto_match_items(text, FT.item_aliases, '#ft_buffList, #ft_itemList');
}


//pre-process: split pasted blobs into lines
function pre_process(raw) {
    const escaped = FT.field_names.map(f =>
        f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const splitter = new RegExp('(?=' + escaped.join('|') + ')', 'gi');
    let text = raw.replace(splitter, '\n');
    text = text.replace(/(?=Round\s)/gi, '\n');
    return text.split('\n').map(l => l.trim()).filter(Boolean);
}

//init: build UI from config
(function build_ui() {
    document.getElementById('ft_buffList').innerHTML = FT.buffs.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');
    document.getElementById('ft_itemList').innerHTML = build_item_html(FT.items, 'ft_itemList');

    const dropdown = document.getElementById('ft_specDropdown');

    function rebuild_spec_dropdown(skills) {
        const prev = dropdown.value;
        let opts = '<option value="">-- None --</option>';

        if (skills && Object.keys(skills).length) {
            const relevant = {};
            for (const [spec, cfg] of Object.entries(FT.specialties)) {
                if (!spec_has_form(spec, 'fight')) continue;
                const skill = cfg.requires;
                if (skill && skills[skill]) {
                    if (!relevant[skill]) relevant[skill] = [];
                    relevant[skill].push(spec);
                }
            }
            for (const [skill, specs] of Object.entries(relevant)) {
                const level = skills[skill];
                const needs_master = level !== 'Master';
                opts += `<optgroup label="${level} ${skill}${needs_master ? ' (requires Master)' : ''}">`;
                specs.forEach(s => {
                    const disabled = needs_master ? ' disabled' : '';
                    opts += `<option value="${s}"${disabled}>${s}</option>`;
                });
                opts += '</optgroup>';
            }
        } else {
            Object.keys(FT.specialties).forEach(s => {
                if (!spec_has_form(s, 'fight')) return;
                opts += `<option value="${s}">${s}</option>`;
            });
        }

        dropdown.innerHTML = opts;
        if (prev && dropdown.querySelector(`option[value="${prev}"]:not(:disabled)`)) {
            dropdown.value = prev;
        }
    }

    rebuild_spec_dropdown(null);
    window._rebuild_spec_dropdown = rebuild_spec_dropdown;

    document.getElementById('ft_specDropdown').addEventListener('change', () => {
        update_textarea_field('ft_fightInput', 'Specialty', document.getElementById('ft_specDropdown').value);
        if (document.getElementById('ft_fightInput').value.trim()) parse_fight();
    });
    //cap enforcement
    function enforce_cap(cb, listId, capKey) {
        if (!cb.checked || !cb.closest('#' + listId)) return true;
        const checked = document.querySelectorAll(`#${listId} input:checked`).length;
        if (checked > FT.caps[capKey]) { cb.checked = false; return false; }
        return true;
    }

    document.querySelectorAll('#ft_buffList input, #ft_itemList input').forEach(cb => {
        cb.addEventListener('change', () => {
            if (!enforce_cap(cb, 'ft_itemList', 'items')) return;
            const bardCb = document.querySelector('#ft_buffList input[value="Bard"]');
            const bardWrap = document.getElementById('ft_bardNameWrap');
            if (bardCb && bardWrap) bardWrap.hidden = !bardCb.checked;

            if (cb.closest('#ft_itemList')) {
                //toggle note field
                const wrap = document.querySelector(`#ft_itemList .ft_item_note_wrap[data-item="${cb.value}"]`);
                if (wrap) {
                    wrap.hidden = !cb.checked;
                    if (!cb.checked) wrap.querySelector('input').value = '';
                }
                const checked = [...document.querySelectorAll('#ft_itemList input[type="checkbox"]:checked')].map(el => el.value);
                update_textarea_field('ft_fightInput', ['Item', 'Items'], checked.join(', '));
            }

            if (document.getElementById('ft_fightInput').value.trim()) parse_fight();
        });
    });

    document.getElementById('ft_bardName').addEventListener('input', () => {
        if (document.getElementById('ft_fightInput').value.trim()) parse_fight();
    });

    //note field reparse
    document.querySelectorAll('#ft_itemList .ft_item_note').forEach(input => {
        input.addEventListener('input', () => {
            if (document.getElementById('ft_fightInput').value.trim()) parse_fight();
        });
    });

    document.getElementById('ft_fleeItemList').innerHTML = FT.flee_items.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');
    document.getElementById('ft_fleeAccessories').innerHTML = FT.race_accessories.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');

    const fleeDropdown = document.getElementById('ft_fleeSpecDropdown');
    const raceDropdown = document.getElementById('ft_raceSpecDropdown');

    //shared flee/race specialty dropdown builder
    function make_movement_spec_rebuilder(dropdown, form) {
        return function(skills) {
            const prev = dropdown.value;
            let opts = '<option value="">-- None --</option>';
            const specs = {};
            for (const [name, cfg] of Object.entries(FT.specialties)) {
                if (cfg.forms && cfg.forms.includes(form)) specs[name] = cfg;
            }

            if (skills && Object.keys(skills).length) {
                for (const [spec, cfg] of Object.entries(specs)) {
                    const req = cfg.requires;
                    if (req && skills[req]) {
                        const disabled = skills[req] !== 'Master' ? ' disabled' : '';
                        opts += `<option value="${spec}"${disabled}>${spec}${disabled ? ' (requires Master)' : ''}</option>`;
                    } else if (req && !skills[req]) {
                        opts += `<option value="${spec}" disabled>${spec} (requires Master ${req})</option>`;
                    } else {
                        opts += `<option value="${spec}">${spec}</option>`;
                    }
                }
            } else {
                Object.keys(specs).forEach(s => {
                    opts += `<option value="${s}">${s}</option>`;
                });
            }

            dropdown.innerHTML = opts;
            if (prev && dropdown.querySelector(`option[value="${prev}"]:not(:disabled)`)) {
                dropdown.value = prev;
            }
        };
    }

    window._rebuild_flee_spec_dropdown = make_movement_spec_rebuilder(fleeDropdown, 'flee');
    window._rebuild_flee_spec_dropdown(null);

    document.getElementById('ft_fleeSpecDropdown').addEventListener('change', () => {
        update_textarea_field('ft_fleeInput', 'Specialty', document.getElementById('ft_fleeSpecDropdown').value);
        if (document.getElementById('ft_fleeInput').value.trim()) parse_flee();
    });
    document.querySelectorAll('#ft_fleeItemList input, #ft_fleeAccessories input').forEach(cb => {
        cb.addEventListener('change', () => {
            if (!enforce_cap(cb, 'ft_fleeItemList', 'flee_items')) return;

            if (cb.closest('#ft_fleeItemList')) {
                const checked = [...document.querySelectorAll('#ft_fleeItemList input:checked')].map(el => el.value);
                update_textarea_field('ft_fleeInput', ['Item', 'Items'], checked.join(', '));
            }
            if (cb.closest('#ft_fleeAccessories')) {
                const checked = [...document.querySelectorAll('#ft_fleeAccessories input:checked')].map(el => el.value);
                update_textarea_field('ft_fleeInput', 'Racing Accessory', checked.join(', '));
            }

            if (document.getElementById('ft_fleeInput').value.trim()) parse_flee();
        });
    });

    document.getElementById('ft_raceItemList').innerHTML = FT.race_items.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');
    document.getElementById('ft_raceAccessories').innerHTML = FT.race_accessories.map(i =>
        `<label><input type="checkbox" value="${i.label}"> ${i.label}</label>`
    ).join('');

    window._rebuild_race_spec_dropdown = make_movement_spec_rebuilder(raceDropdown, 'race');
    window._rebuild_race_spec_dropdown(null);

    document.getElementById('ft_raceSpecDropdown').addEventListener('change', () => {
        update_textarea_field('ft_raceInput', 'Specialty', document.getElementById('ft_raceSpecDropdown').value);
        if (document.getElementById('ft_raceInput').value.trim()) parse_race();
    });
    document.querySelectorAll('#ft_raceItemList input, #ft_raceAccessories input').forEach(cb => {
        cb.addEventListener('change', () => {
            if (!enforce_cap(cb, 'ft_raceItemList', 'race_items')) return;

            if (cb.closest('#ft_raceItemList')) {
                const checked = [...document.querySelectorAll('#ft_raceItemList input:checked')].map(el => el.value);
                update_textarea_field('ft_raceInput', ['Item', 'Items'], checked.join(', '));
            }
            if (cb.closest('#ft_raceAccessories')) {
                const checked = [...document.querySelectorAll('#ft_raceAccessories input:checked')].map(el => el.value);
                update_textarea_field('ft_raceInput', 'Racing Accessory', checked.join(', '));
            }

            if (document.getElementById('ft_raceInput').value.trim()) parse_race();
        });
    });

    const qrSelect = document.getElementById('ft_qrSelect');
    FT.quick_rolls.forEach((r, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = r.name;
        qrSelect.appendChild(opt);
    });
    qrSelect.addEventListener('change', () => {
        build_quick_roll_fields(+qrSelect.value);
    });
    if (FT.quick_rolls.length) build_quick_roll_fields(0);
})();


// FIGHT
function clear_fight_form() {
    document.getElementById('ft_fightInput').value = '';
    document.querySelectorAll('#ft_buffList input, #ft_itemList input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#ft_itemList .ft_item_note').forEach(n => n.value = '');
    document.querySelectorAll('#ft_itemList .ft_item_note_wrap').forEach(w => w.hidden = true);
    document.getElementById('ft_fightAlerts').hidden = true;
    document.getElementById('ft_fightOutput').hidden = true;
    document.getElementById('ft_skillText').textContent = '--';
    document.getElementById('ft_specDropdown').value = '';
    document.getElementById('ft_specAlert').hidden = true;
    window._rebuild_spec_dropdown(null);
    document.getElementById('ft_bardName').value = '';
    document.getElementById('ft_bardNameWrap').hidden = true;
}
function clear_fight_output() {
    document.getElementById('ft_fightOutput').hidden = true;
}
function clear_fight() { clear_fight_form(); clear_fight_output(); }
function generate_fight() { parse_fight(true); }

//reentrancy guard
let _parsing = false;

function parse_fight(force) {
    if (_parsing) return;
    _parsing = true;
    try { _parse_fight_inner(force); } finally { _parsing = false; }
}

function _parse_fight_inner(force) {
    const raw = document.getElementById('ft_fightInput').value.trim();
    if (!raw) return;

    const dupe_alerts = [];
    const is_dupe = detect_duplicate_form(raw, dupe_alerts);
    if (is_dupe) {
        render_alerts_box('ft_fightAlerts', dupe_alerts, []);
        if (!is_live() && !force) return;
        render_issues(dupe_alerts, 'ft_fightOutput');
        return;
    }

    const lines = pre_process(raw);
    const data = {
        char: '', opponent: '', type: '', round: '',
        age: '', age_raw: '', size: '', build: '',
        off_acc: '', def_acc: '', creepy_contacts: 0,
        off_acc_count: 0, def_acc_count: 0,
        companions: [],
        mutations: [],
        skills: {},
        specialties: [],
        form_items: [],
        debuff: '', debuff_raw: '',
        disability: '', disability_raw: '',
        acc_slots: 0,
        active_buffs: [],
        _parsed_spec_names: [],
    };

    const alerts = [];
    const typos = [];

    const vs = lines[0].match(/^[*]?\s*(.+?)\s+vs\s+(.+?)\s+for\s+(.+)$/i);
    const unfilled = [];
    if (vs) {
        data.char = vs[1].trim();
        data.opponent = vs[2].trim();
        data.type = vs[3].trim();
        if (is_placeholder(data.opponent)) unfilled.push('Opponent');
        if (is_placeholder(data.type)) unfilled.push('Fight type');
    } else {
        data._no_vs = true;
    }

    for (const line of lines) {
        const round_no_colon = line.match(/^\*?\s*round(\s+(.+))?$/i);
        if (round_no_colon && !line.includes(':')) {
            data.round = (round_no_colon[2] || '').trim() || '_found';
            if (data.round === '_found' || /^\s*x\s*\/\s*x\s*$/i.test(data.round) || is_placeholder(data.round)) {
                unfilled.push('Round');
            }
            continue;
        }

        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            const raw_key = line.slice(0, colon_idx).trim();
            key = raw_key.replace(/^\*+\s*/, '').toLowerCase();
            val = clean_val(line.slice(colon_idx + 1));
        } else {
            //colonless fallback
            const colonless = line.replace(/^\*+\s*/, '').match(/^(age|size|build|skills?|specialty|items?|disability|debuffs?|injury|offensive battle accessory|defensive battle accessory)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase();
            val = clean_val(colonless[2]);
        }

        if (is_placeholder(val)) continue;

        if (key.startsWith('round')) {
            data.round = val || '_found';
            if (data.round === '_found' || /^\s*x\s*\/\s*x\s*$/i.test(data.round) || is_placeholder(data.round)) {
                unfilled.push('Round');
            }
        }
        else if (key === 'age') {
            data.age_raw = val;
            data.age = parse_age(val);
            if (!data.age)
                alerts.push({ msg: `Age "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'size') {
            data.size = resolve_size(val, typos);
            if (!data.size)
                alerts.push({ msg: `Size "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'build') {
            data.build = fuzzy_match(val, Object.keys(FT.builds));
            if (data.build && data.build.toLowerCase() !== val.toLowerCase())
                typos.push(`Build "${val}" → "${data.build}"`);
            if (!data.build)
                alerts.push({ msg: `Build "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'offensive battle accessory') {
            if (/creepy\s*contacts?/i.test(val)) {
                data.creepy_contacts++;
                data.acc_slots++;
            } else {
                data.off_acc = val;
                data.off_acc_count++;
                data.acc_slots++;
            }
        }
        else if (key === 'defensive battle accessory') {
            if (/creepy\s*contacts?/i.test(val)) {
                data.creepy_contacts++;
                data.acc_slots++;
            } else {
                data.def_acc = val;
                data.def_acc_count++;
                data.acc_slots++;
            }
        }
        else if (key.startsWith('companion')) {
            data.companions.push(parse_companion(val, typos));
        }
        else if (key.startsWith('mutation')) {
            data.mutations.push(parse_mutation(val, typos));
        }
        else if (key === 'skills') {
            data.skills = parse_skills(val, typos, alerts);
        }
        else if (key === 'specialty') {
            data.specialties = parse_specialties(val, typos, alerts);
            data._parsed_spec_names = [...data.specialties];
        }
        else if (key === 'item' || key === 'items') {
            if (val) {
                const matched = auto_select_items(val);
                if (!matched) alerts.push({ msg: `Item "${val}" not recognized.`, level: 'warn' });
            }
        }
        else if (key === 'debuff' || key === 'debuffs' || key === 'injury') {
            const mod = /major/i.test(val) ? 'Major' : /moderate/i.test(val) ? 'Moderate' : /minor/i.test(val) ? 'Minor' : '';
            data.debuff = mod;
            data.debuff_raw = val;
            if (!mod) alerts.push({ msg: `Debuff "${val}" missing severity.`, level: 'err' });
        }
        else if (key === 'disability') {
            const mod = /major/i.test(val) ? 'Major' : /moderate/i.test(val) ? 'Moderate' : /minor/i.test(val) ? 'Minor' : '';
            data.disability = mod;
            data.disability_raw = val;
            if (!mod) alerts.push({ msg: `Disability "${val}" missing severity.`, level: 'err' });
        }
    }

    //dropdown override
    const selected_spec = document.getElementById('ft_specDropdown').value;
    data.specialties = selected_spec ? [selected_spec] : [];

    const has_rankless = Object.values(data.skills).some(v => v === null);

    if (!has_rankless) {
        //specialty skill mismatch check
        if (!selected_spec) validate_spec_skills(data._parsed_spec_names, data.skills, alerts);
        validate_spec_skills(data.specialties, data.skills, alerts);
    }

    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (!cfg) return;
        let has_conflict = false;
        if (cfg.effect && cfg.effect.condition && cfg.effect.conflict) {
            const cond = cfg.effect.condition;
            let failed = false;
            if (cond.must_be === 'empty') failed = !!data[cond.field];
            else if (cond.must_be === 'filled') failed = !data[cond.field];
            else if (cond.must_be === 'under_cap') {
                const arr = data[cond.field];
                failed = Array.isArray(arr) && arr.length >= (FT.caps[cond.field] || Infinity);
            }
            if (failed) {
                alerts.push({ msg: `${spec}: ${cfg.effect.conflict}`, level: 'warn' });
                has_conflict = true;
            }
        }
        if (!has_conflict && cfg.reminder)
            alerts.push({ msg: `${spec}: ${cfg.reminder}`, level: 'warn', _reminder: true });
    });


    const missing = [];
    if (data._no_vs) missing.push('VS line');
    if (!data.age && !data.age_raw) missing.push('Age');
    if (!data.size && !alerts.find(a => a.msg.startsWith('Size'))) missing.push('Size');
    if (!data.build && !alerts.find(a => a.msg.startsWith('Build'))) missing.push('Build');
    if (!has_rankless && !Object.keys(data.skills).length) missing.push('Skills');
    if (missing.length)
        alerts.push({ msg: `Missing: ${missing.join(', ')}.`, level: 'err' });
    if (!data.round) unfilled.push('Round');
    if (unfilled.length)
        alerts.push({ msg: `Unfilled: ${unfilled.join(', ')}.`, level: 'warn' });
    if (!has_rankless) {
        if (Object.keys(data.skills).length && Object.keys(data.skills).length !== 2) {
            const n = Object.keys(data.skills).length;
            alerts.push({ msg: `${n === 1 ? 'Only 1 skill' : n + ' skills'} found, exactly 2 required.`, level: 'err' });
        }
    }

    data.companions.forEach((comp, i) => {
        if (!comp.name || is_placeholder(comp.name))
            alerts.push({ msg: `Companion ${i+1} missing name.`, level: 'err' });
        if (!comp.type)
            alerts.push({ msg: `Companion ${i+1} "${comp.name}" missing type.`, level: 'err' });
    });
    data.mutations.forEach((mut, i) => {
        if (!mut.name || is_placeholder(mut.name))
            alerts.push({ msg: `Mutation ${i+1} missing name.`, level: 'err' });
        if (!mut.type)
            alerts.push({ msg: `Mutation ${i+1} "${mut.name}" missing type.`, level: 'err' });
    });

    if (data.companions.length > FT.caps.companions)
        alerts.push({ msg: `Too many companions (max ${FT.caps.companions}).`, level: 'err' });

    if (data.off_acc_count > 1)
        alerts.push({ msg: `Multiple offensive accessories (max 1).`, level: 'err' });

    if (data.def_acc_count > 1)
        alerts.push({ msg: `Multiple defensive accessories (max 1).`, level: 'err' });

    if (data.creepy_contacts > 1)
        alerts.push({ msg: `Creepy Contacts listed ${data.creepy_contacts} times (max 1).`, level: 'err' });

    if (data.acc_slots > FT.caps.accessories)
        alerts.push({ msg: `Too many accessories (max ${FT.caps.accessories}).`, level: 'err' });

    if (data.off_acc && data.def_acc && data.off_acc.toLowerCase() === data.def_acc.toLowerCase())
        alerts.push({ msg: `Same accessory "${data.off_acc}" in both offensive and defensive slots.`, level: 'err' });

    const fight_muts = data.mutations.filter(m => m.type).length;
    if (fight_muts > FT.caps.mutations)
        alerts.push({ msg: `${fight_muts} mutations exceeds cap of ${FT.caps.mutations}.`, level: 'err' });

    const checked_buffs_data = [...document.querySelectorAll('#ft_buffList input:checked')]
        .map(el => FT.buffs.find(b => b.label === el.value));
    const checked_buffs = checked_buffs_data.map(b => b.label);
    data.active_buffs = checked_buffs_data;

    data.active_items = [...document.querySelectorAll('#ft_itemList input:checked')]
        .map(el => FT.items.find(i => i.label === el.value)).filter(Boolean);

    if (data.active_items.length > FT.caps.items)
        alerts.push({ msg: `Too many items (max ${FT.caps.items}).`, level: 'err' });
    else data.active_items.forEach(item => {
        if (item.type === 'special' && item.reminder)
            alerts.push({ msg: `${item.label}: ${item.reminder}`, level: 'warn', _reminder: true });
        if (item.effect && item.effect.condition && item.effect.conflict) {
            const cond = item.effect.condition;
            let failed = false;
            if (cond.must_be === 'empty') {
                failed = !!data[cond.field];
            } else if (cond.must_be === 'filled') {
                failed = !data[cond.field];
            } else if (cond.must_be === 'under_cap') {
                const arr = data[cond.field];
                const cap = FT.caps[cond.field] || Infinity;
                failed = Array.isArray(arr) && arr.length >= cap;
            }
            if (failed)
                alerts.push({ msg: `${item.label}: ${item.effect.conflict}`, level: 'err' });
        }
    });

    const calc = calculate(data);

    render_alerts_box('ft_fightAlerts', alerts, typos);

    if (!is_live() && !force) return;

    if (render_issues(alerts, 'ft_fightOutput')) return;

    render_output(data, calc, checked_buffs);
}


//fight calculator
function calculate(data) {
    const stats = { ATK: 0, DEF: 0, AGI: 0, PER: 0 };
    const total = { value: 0, notes: [] };
    const rows = [];

    const calc = {
        add_stat(stat, val, source) {
            stats[stat] += val;
            rows.push({ source, type: stat, val });
        },
        add_total(val, source) {
            total.value += val;
            rows.push({ source, type: 'TOTAL', val });
        },
        stats, total, rows
    };

    //reduce effects first
    const active_items = data.active_items || [];
    const reductions = {};
    active_items.forEach(item => {
        if (item.type !== 'stat' || !item.effect || !item.effect.reduce) return;
        const field = item.effect.reduce;
        if (!reductions[field]) reductions[field] = item.effect.levels || {};
    });
    for (const [field, levels] of Object.entries(reductions)) {
        if (data[field] && levels[data[field]] !== undefined) {
            const reduced = levels[data[field]];
            data['_original_' + field] = data[field];
            data[field] = reduced;
            if (data[field + '_raw']) data[field + '_raw'] = reduced ? '(reduced) ' + reduced : '';
        }
    }

    if (data.age && FT.ages[data.age] && FT.ages[data.age].TOTAL)
        calc.add_total(FT.ages[data.age].TOTAL, 'Age (' + data.age + ')');

    if (data.size && FT.sizes[data.size]) {
        for (const [k, v] of Object.entries(FT.sizes[data.size])) calc.add_stat(k, v, 'Size');
    }

    if (data.build && FT.builds[data.build]) {
        for (const [k, v] of Object.entries(FT.builds[data.build])) calc.add_stat(k, v, 'Build');
    }

    if (data.off_acc) calc.add_stat('ATK', 10, 'Off. Accessory');
    if (data.def_acc) calc.add_stat('DEF', 10, 'Def. Accessory');
    if (data.creepy_contacts) calc.add_stat('PER', 10, 'Creepy Contacts');

    data.companions.forEach((comp, i) => {
        if (!comp.type) return;
        const label = 'Companion ' + (i + 1) + (comp.boosted ? ' (boosted)' : '');
        const val = comp.boosted ? 20 : 10;
        if (comp.type === 'battle' || comp.type === 'attack') {
            calc.add_stat('ATK', val, label);
        } else if (comp.type === 'flying' || comp.type === 'perception') {
            calc.add_stat('PER', val, label);
        }
    });

    const mut_counts = {};
    let mut_total = 0;
    data.mutations.forEach((mut, i) => {
        if (!mut.type) return;
        if (mut_total >= FT.caps.mutations) return;
        const cfg = FT.mutation_types[mut.type];
        if (!cfg) return;
        mut_counts[mut.type] = (mut_counts[mut.type] || 0) + 1;
        const val = mut_counts[mut.type] === 1 ? FT.mutations.first : FT.mutations.extra_same;
        calc.add_stat(cfg.stat, val, 'Mutation ' + (i + 1));
        mut_total++;
    });

    for (const [skill, level] of Object.entries(data.skills)) {
        const stat = skill_stat(skill);
        const val = skill_value(skill, level);
        if (stat === undefined || val === undefined || val === 0) continue;
        const label = level + ' ' + skill;
        if (stat === 'TOTAL') calc.add_total(val, label);
        else calc.add_stat(stat, val, label);
    }

    data.specialties.forEach(spec => {
        const s = FT.specialties[spec];
        if (!s) return;
        for (const [k, v] of Object.entries(s)) {
            if (_spec_skip.includes(k)) continue;
            if (k === 'TOTAL') calc.add_total(v, spec);
            else calc.add_stat(k, v, spec);
        }
    });

    //conditional specialty effects
    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (!cfg || !cfg.effect || !cfg.effect.condition) return;
        const eff = cfg.effect;
        const cond = eff.condition;
        let pass = false;
        if (cond.must_be === 'empty') pass = !data[cond.field];
        else if (cond.must_be === 'filled') pass = !!data[cond.field];
        else if (cond.must_be === 'under_cap') {
            const arr = data[cond.field];
            pass = !Array.isArray(arr) || arr.length < (FT.caps[cond.field] || Infinity);
        }
        if (pass) {
            if (eff.stat === 'TOTAL') calc.add_total(eff.value, spec);
            else calc.add_stat(eff.stat, eff.value, spec);
        }
    });

    if (data.debuff && FT.debuffs[data.debuff + 'Injury'] && FT.debuffs[data.debuff + 'Injury'].TOTAL)
        calc.add_total(FT.debuffs[data.debuff + 'Injury'].TOTAL, 'Debuff (' + data.debuff + ')');

    if (data.disability && FT.disabilities[data.disability] && FT.disabilities[data.disability].TOTAL) {
        const reduced = data._original_disability ? ', reduced' : '';
        calc.add_total(FT.disabilities[data.disability].TOTAL, 'Disability (' + data.disability + reduced + ')');
    }

    //conditional items
    active_items.forEach(item => {
        if (item.type !== 'stat' || !item.effect || !item.effect.value || !item.effect.condition) return;
        const cond = item.effect.condition;
        let pass = false;
        if (cond.must_be === 'empty') {
            pass = !data[cond.field];
        } else if (cond.must_be === 'filled') {
            pass = !!data[cond.field];
        } else if (cond.must_be === 'under_cap') {
            const arr = data[cond.field];
            const cap = FT.caps[cond.field] || Infinity;
            pass = !Array.isArray(arr) || arr.length < cap;
        }
        if (pass) {
            if (item.effect.stat === 'TOTAL') calc.add_total(item.effect.value, item.label);
            else calc.add_stat(item.effect.stat, item.effect.value, item.label);
        }
    });

    //flat items
    active_items.forEach(item => {
        if (item.type !== 'stat' || !item.stat || !item.value) return;
        if (item.stat === 'TOTAL') calc.add_total(item.value, item.label);
        else calc.add_stat(item.stat, item.value, item.label);
    });

    data.active_buffs.forEach(buff => {
        calc.add_total(buff.value, buff.label);
    });

    return calc;
}

//companion parser
function parse_age(val) {
    if (/under\s*6/i.test(val)) return 'Under6mo';
    if (/under\s*1[^0-9]/i.test(val)) return 'Under1y';
    const seasons = val.match(/(\d+)\s*season/i);
    if (seasons) {
        const n = parseInt(seasons[1]);
        if (n <= 1) return 'Under6mo';
        if (n <= 3) return 'Under1y';
        return '1y+';
    }
    if (/\d+\s*year/i.test(val)) return '1y+';
    return '';
}

function resolve_size(val, typos) {
    const aliased = FT.size_aliases[val.toLowerCase().trim()];
    if (aliased) return aliased;
    const matched = fuzzy_match(val, Object.keys(FT.sizes));
    if (matched && matched.toLowerCase() !== val.toLowerCase())
        typos.push(`Size "${val}" → "${matched}"`);
    return matched;
}

//companion type extraction
function parse_companion(val, typos) {
    const comp = { name: '', type: '', boosted: false };
    const types = ['battle', 'flying', 'perception', 'attack'];
    let remaining = val;

    if (/\bboosted\b/i.test(remaining)) {
        comp.boosted = true;
        remaining = remaining.replace(/\bboosted\b/i, '');
    }

    for (const type of types) {
        const regex = new RegExp('\\b' + type + '\\b', 'i');
        if (regex.test(remaining)) {
            comp.type = type;
            remaining = remaining.replace(regex, '');
            break;
        }
        //stuck to end
        const endRegex = new RegExp(type + '$', 'i');
        if (endRegex.test(remaining)) {
            comp.type = type;
            remaining = remaining.replace(endRegex, '');
            break;
        }
    }

    if (!comp.type) {
        const words = remaining.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const clean = words[i].replace(/[^a-zA-Z]/g, '');
            const matched = fuzzy_match(clean, types, 2);
            if (matched) {
                typos.push(`Companion type "${clean}" → "${matched}"`);
                comp.type = matched.toLowerCase();
                words.splice(i, 1);
                remaining = words.join(' ');
                break;
            }
        }
    }

    comp.name = remaining.replace(/\s*[-–,()]\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return comp;
}

//mutation parser
function parse_mutation(val, typos) {
    const types = Object.keys(FT.mutation_types);

    //find type from back
    for (const type of types) {
        const trailRegex = new RegExp('[\\s\\-–:,(/]*' + type + '[\\s)]*$', 'i');
        if (trailRegex.test(val)) {
            const name = val.replace(trailRegex, '').trim();
            if (name) return { name, type: type.toLowerCase() };
        }
    }

    //fuzzy fallback
    const words = val.split(/[\s\-–:,()]+/).filter(Boolean);
    for (let i = words.length - 1; i >= 0; i--) {
        const clean = words[i].replace(/[^a-zA-Z]/g, '');
        const matched = fuzzy_match(clean, types, 2);
        if (matched) {
            typos.push(`Mutation type "${words[i]}" → "${matched}"`);
            words.splice(i, 1);
            const name = words.join(' ').trim();
            return { name, type: matched.toLowerCase() };
        }
    }

    return { name: val.trim(), type: '' };
}

function parse_skills(val, typos, alerts) {
    const result = {};
    //normalize "and" to "&"
    let normalized = val;
    if (/\band\b/i.test(val)) {
        alerts.push({ msg: 'Skills uses "and" instead of "&".', level: 'warn' });
        normalized = val.replace(/\band\b/gi, '&');
    }
    normalized.split(/[&,]+/).forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const m = trimmed.match(/^(novice|intermediate|advanced|expert|master)\s+(.+)$/i);
        if (m) {
            const level = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
            const raw_skill = m[2].trim();
            const skill = match_skill(raw_skill);
            if (skill) {
                if (FT.skill_levels[level] === undefined) {
                    alerts.push({ msg: `${skill} doesn't have "${level}" rank.`, level: 'err' });
                    return;
                }
                if (skill.toLowerCase() !== raw_skill.toLowerCase() &&
                    !FT.skill_aliases[raw_skill.toLowerCase()])
                    typos.push(`Skill "${raw_skill}" → "${skill}"`);
                result[skill] = level;
            }
        } else {
            const skill = match_skill(trimmed);
            if (skill) {
                alerts.push({ msg: `"${trimmed}" is missing a skill rank.`, level: 'err' });
                result[skill] = null; //present but rankless
            }
        }
    });
    return result;
}

function parse_specialties(val, typos, alerts) {
    return parse_specialties_for_form(val, 'fight', typos, alerts);
}
function render_output(data, calc, checked_buffs) {
    const box = document.getElementById('ft_fightOutput');
    const s = calc.stats;
    const t = calc.total;

    let total_line = `Total score bonus: ${t.value}%`;

    const all_item_labels = [
        ...data.active_items.map(i => get_item_display(i.label, 'ft_itemList')),
        ...data.form_items
    ];

    let msg1 = '';
    msg1 += `${data.char}\n`;
    msg1 += `Age: ${data.age_raw || data.age}\n`;
    if (data.size) msg1 += `Size: ${data.size}\n`;
    if (data.build) msg1 += `Build: ${data.build}\n`;
    if (data.off_acc) msg1 += `Offensive Battle Accessory: ${data.off_acc}\n`;
    if (data.def_acc) msg1 += `Defensive Battle Accessory: ${data.def_acc}\n`;
    if (data.creepy_contacts) msg1 += `Creepy Contacts: Yes\n`;
    data.companions.forEach((c, i) => {
        let cl = `Companion ${i+1}: ${c.name}`;
        if (c.type) cl += ` - ${c.type}`;
        if (c.boosted) cl += ' - boosted';
        msg1 += cl + '\n';
    });
    data.mutations.forEach((m, i) => {
        msg1 += `Mutation ${i+1}: ${m.name}` + (m.type ? ` - ${m.type}` : '') + '\n';
    });
    if (Object.keys(data.skills).length) {
        msg1 += `Skills: ${format_skills_text(data.skills, ' & ')}\n`;
    }
    if (data.specialties.length) {
        msg1 += `Specialty: ${data.specialties.join(' & ')}\n`;
    }
    if (data.debuff) {
        msg1 += `Debuff: ${data.debuff_raw}\n`;
    }
    if (data.disability) {
        msg1 += `Disability: ${data.disability_raw}\n`;
    }
    if (all_item_labels.length) {
        msg1 += `Item: ${all_item_labels.join(', ')}\n`;
    }
    if (checked_buffs.length) {
        const display_buffs = checked_buffs.map(label => {
            if (label === 'Bard') {
                const bardName = document.getElementById('ft_bardName').value.trim();
                return bardName ? `Bard (${bardName})` : 'Bard';
            }
            return label;
        });
        msg1 += `Buff: ${display_buffs.join(', ')}\n`;
    }
    msg1 += `\nAttack bonus: ${s.ATK}%\n`;
    msg1 += `Defense bonus: ${s.DEF}%\n`;
    msg1 += `Agility bonus: ${s.AGI}%\n`;
    msg1 += `Perception bonus: ${s.PER}%\n`;
    msg1 += total_line;

    const cmd_parts = [`!roll fight(${s.ATK},${s.DEF},${s.AGI},${s.PER},${t.value})`];
    data.active_items.forEach(item => {
        if (item.type === 'append' && item.cmd) cmd_parts.push(item.cmd);
    });
    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (cfg && cfg.cmd) cmd_parts.push(cfg.cmd);
    });
    const msg2 = cmd_parts.join(' ');

    //consolidate same-source rows
    const merged = [];
    for (const row of calc.rows) {
        const existing = merged.find(r => r.source === row.source && !r.note && !row.note);
        if (existing) {
            if (row.type === 'TOTAL') existing.TOTAL = (existing.TOTAL || 0) + row.val;
            else existing[row.type] = (existing[row.type] || 0) + row.val;
        } else {
            const entry = { source: row.source, note: row.note || '' };
            if (row.type === 'TOTAL') entry.TOTAL = row.val;
            else entry[row.type] = row.val;
            merged.push(entry);
        }
    }

    let breakdown_rows = '';
    for (const row of merged) {
        const has_neg = ['ATK','DEF','AGI','PER','TOTAL'].some(s => (row[s] || 0) < 0);
        const cls = has_neg ? ' class="ft_row_neg"' : '';
        const cells = ['ATK','DEF','AGI','PER','TOTAL'].map(stat => {
            const v = row[stat];
            if (!v) return '<td>-</td>';
            const fmt = (v > 0 ? '+' : '') + v + '%';
            return `<td>${fmt}</td>`;
        }).join('');
        const note = row.note ? ` <small>(${row.note})</small>` : '';
        breakdown_rows += `<tr${cls}><td class="ft_breakdown_source">${row.source}${note}</td>${cells}</tr>`;
    }
    breakdown_rows += `<tr class="ft_row_total">`;
    breakdown_rows += `<td class="ft_breakdown_source">Total</td>`;
    breakdown_rows += `<td>${s.ATK}%</td><td>${s.DEF}%</td><td>${s.AGI}%</td><td>${s.PER}%</td>`;
    breakdown_rows += `<td>${t.value}%</td></tr>`;

    box.innerHTML = `
        <div class="ft_output_wrap">
            <div class="ft_output_left">
                <div class="ft_msg_box">
                    <strong>MESSAGE ONE:</strong>
                    <pre id="ft_msg1" class="ft_selectable ft_pre_msg ft_pre_msg1" onclick="copy_text('ft_msg1')">${msg1}</pre>
                    <small>Click to copy</small>
                </div>
            </div>
            <div class="ft_output_right">
                <div class="ft_msg_box ft_msg_box_right">
                    <strong>MESSAGE TWO:</strong>
                    <pre id="ft_msg2" class="ft_selectable ft_pre_msg" onclick="copy_text('ft_msg2')">${msg2}</pre>
                    <small>Click to copy</small>
                </div>
                <strong>BREAKDOWN:</strong>
                <div class="ft_breakdown">
                    <table>
                        <tr><th class="ft_breakdown_source">Source</th><th>ATK</th><th>DEF</th><th>AGI</th><th>PER</th><th>TOTAL</th></tr>
                        ${breakdown_rows}
                    </table>
                </div>
            </div>
        </div>
    `;
    box.hidden = false;
}

//scan: populate UI from text. parse: do the math
function scan_fight() {
    const raw = document.getElementById('ft_fightInput').value.trim();
    if (!raw) return false;

    document.querySelectorAll('#ft_buffList input, #ft_itemList input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#ft_itemList .ft_item_note_wrap').forEach(w => w.hidden = true);
    document.getElementById('ft_bardNameWrap').hidden = true;
    document.getElementById('ft_skillText').textContent = '--';
    window._rebuild_spec_dropdown(null);

    const lines = pre_process(raw);

    for (const line of lines) {
        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            key = line.slice(0, colon_idx).trim().replace(/^\*+\s*/, '').toLowerCase();
            val = clean_val(line.slice(colon_idx + 1));
        } else {
            const colonless = line.replace(/^\*+\s*/, '').match(/^(skills?|specialty|items?)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase();
            val = clean_val(colonless[2]);
        }

        if ((key === 'item' || key === 'items') && val && !is_placeholder(val)) {
            auto_select_items(val);
        }

        if (key === 'skills' && val) {
            const parsed = parse_skills(val, [], []);
            if (Object.keys(parsed).length) {
                document.getElementById('ft_skillText').textContent =
                    format_skills_text(parsed);
                window._rebuild_spec_dropdown(parsed);
            }
        }

        if (key === 'specialty' && val && !is_placeholder(val)) {
            const specs = val.replace(/\band\b/gi, '&').split(/[&,]+/).map(s => s.trim()).filter(s => s && !is_placeholder(s));
            const dropdown = document.getElementById('ft_specDropdown');
            const spec_alert = document.getElementById('ft_specAlert');
            const all_known = Object.keys(FT.specialties);

            const valid_specs = specs.map(s => fuzzy_match(s, all_known))
                .filter(s => s && spec_has_form(s, 'fight'));

            if (valid_specs.length === 1) {
                dropdown.value = valid_specs[0];
                spec_alert.hidden = true;
            } else if (valid_specs.length > 1) {
                dropdown.value = '';
                spec_alert.textContent = `${valid_specs.length} specialties found. Edit the field or manually select one.`;
                spec_alert.hidden = false;
            } else {
                dropdown.value = '';
                spec_alert.hidden = true;
            }
        }
    }

    const bardCb = document.querySelector('#ft_buffList input[value="Bard"]');
    if (bardCb) document.getElementById('ft_bardNameWrap').hidden = !bardCb.checked;
    //show note fields
    document.querySelectorAll('#ft_itemList input[type="checkbox"]:checked').forEach(cb => {
        const wrap = document.querySelector(`#ft_itemList .ft_item_note_wrap[data-item="${cb.value}"]`);
        if (wrap) wrap.hidden = false;
    });
    return true;
}

document.getElementById('ft_fightInput').addEventListener('input', function() {
    const raw = this.value.trim();
    if (!raw) { clear_fight(); return; }
    scan_fight();
    parse_fight();
});


// FLEE
function auto_select_flee_items(text) {
    return auto_match_items(text, FT.item_aliases, '#ft_fleeItemList');
}

function scan_flee() {
    const raw = document.getElementById('ft_fleeInput').value.trim();
    if (!raw) return false;

    document.querySelectorAll('#ft_fleeItemList input, #ft_fleeAccessories input').forEach(cb => cb.checked = false);
    document.getElementById('ft_fleeSkillText').textContent = '--';
    window._rebuild_flee_spec_dropdown(null);

    const lines = pre_process(raw);

    for (const line of lines) {
        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            key = line.slice(0, colon_idx).trim().replace(/^\*+\s*/, '').toLowerCase();
            val = clean_val(line.slice(colon_idx + 1));
        } else {
            const colonless = line.replace(/^\*+\s*/, '').match(/^(skills?|specialty|items?|racing accessory)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase();
            val = clean_val(colonless[2]);
        }

        if ((key === 'item' || key === 'items') && val && !is_placeholder(val)) {
            auto_select_flee_items(val);
        }

        if (key === 'racing accessory' && val && !is_placeholder(val)) {
            const lower = val.toLowerCase();
            FT.race_accessories.forEach(acc => {
                if (lower.includes(acc.label.toLowerCase())) {
                    const cb = document.querySelector(`#ft_fleeAccessories input[value="${acc.label}"]`);
                    if (cb) cb.checked = true;
                }
            });
        }

        if (key === 'skills' && val) {
            const parsed = parse_skills(val, [], []);
            if (Object.keys(parsed).length) {
                document.getElementById('ft_fleeSkillText').textContent =
                    format_skills_text(parsed);
                window._rebuild_flee_spec_dropdown(parsed);
            }
        }

        if (key === 'specialty' && val && !is_placeholder(val)) {
            const fleeDropdown = document.getElementById('ft_fleeSpecDropdown');
            const fleeSpecAlert = document.getElementById('ft_fleeSpecAlert');
            const all_known = Object.keys(FT.specialties);
            const matched = fuzzy_match(val.trim(), all_known);
            if (matched && spec_has_form(matched, 'flee')) {
                fleeDropdown.value = matched;
                fleeSpecAlert.hidden = true;
            } else {
                fleeDropdown.value = '';
                fleeSpecAlert.hidden = true;
            }
        }
    }
    return true;
}

document.getElementById('ft_fleeInput').addEventListener('input', function() {
    const raw = this.value.trim();
    if (!raw) { clear_flee(); return; }
    scan_flee();
    parse_flee();
});

let _parsing_flee = false; //reentrancy guard

function parse_flee(force) {
    if (_parsing_flee) return;
    _parsing_flee = true;
    try { _parse_flee_inner(force); } finally { _parsing_flee = false; }
}

function _parse_flee_inner(force) {
    const raw = document.getElementById('ft_fleeInput').value.trim();
    if (!raw) return;

    const dupe_alerts = [];
    const is_dupe = detect_duplicate_form(raw, dupe_alerts);
    if (is_dupe) {
        render_alerts_box('ft_fleeAlerts', dupe_alerts, []);
        if (!is_live() && !force) return;
        render_issues(dupe_alerts, 'ft_fleeOutput');
        return;
    }

    const alerts = [];
    const typos = [];

    detect_wrong_tab(raw, 'flee', alerts);

    const data = {
        name: '', size: '', build: '',
        accessories: [], skills: {}, specialties: [],
        active_items: [],
    };

    const lines = pre_process(raw);

    const first_line = lines[0] || '';
    if (!first_line.includes(':')) {
        data.name = first_line.replace(/\s*-?\s*(flee|attempt|round\s*\d+.*)/gi, '').trim();
    }

    for (const line of lines) {
        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            key = line.slice(0, colon_idx).trim().replace(/^\*+\s*/, '');
            val = clean_val(line.slice(colon_idx + 1));
            key = key.toLowerCase().replace(/\d+/g, '').trim();
        } else {
            const colonless = line.replace(/^\*+\s*/, '').match(/^(size|build|skills?|specialty|items?|racing accessory)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase().replace(/\d+/g, '').trim();
            val = clean_val(colonless[2]);
        }
        if (!val || is_placeholder(val)) continue;

        if (key === 'size') {
            data.size = fuzzy_match_alias(val, FT.size_aliases) || fuzzy_match(val, Object.keys(FT.race_sizes));
            if (!data.size) alerts.push({ msg: `Size "${val}" not recognized.`, level: 'err' });
            else if (data.size.toLowerCase() !== val.toLowerCase()) {
                const alias = FT.size_aliases[val.toLowerCase()];
                if (!alias) typos.push(`Size "${val}" → "${data.size}"`);
            }
        }
        else if (key === 'build') {
            data.build = fuzzy_match(val, Object.keys(FT.race_builds));
            if (!data.build) alerts.push({ msg: `Build "${val}" not recognized.`, level: 'err' });
            else if (data.build.toLowerCase() !== val.toLowerCase())
                typos.push(`Build "${val}" → "${data.build}"`);
        }
        else if (key === 'racing accessory') {
            const lower = val.toLowerCase();
            FT.race_accessories.forEach(acc => {
                if (lower.includes(acc.label.toLowerCase()) && !data.accessories.includes(acc.label))
                    data.accessories.push(acc.label);
            });
        }
        else if (key === 'skills') {
            data.skills = parse_skills(val, typos, alerts);
        }
        else if (key === 'specialty') {
            data.specialties = parse_specialties_for_form(val, 'flee', typos, alerts);
            data._parsed_spec_names = [...data.specialties];
        }
        else if (key === 'item' || key === 'items') {
            if (val) {
                const matched = auto_select_flee_items(val);
                if (!matched) alerts.push({ msg: `Item "${val}" not recognized.`, level: 'warn' });
            }
        }
    }

    data.accessories = [...document.querySelectorAll('#ft_fleeAccessories input:checked')]
        .map(el => el.value);

    const selected_spec = document.getElementById('ft_fleeSpecDropdown').value;
    data.specialties = selected_spec ? [selected_spec] : [];

    if (!Object.values(data.skills).some(v => v === null)) {
        validate_spec_skills(data.specialties, data.skills, alerts);
        if (!selected_spec) validate_spec_skills(data._parsed_spec_names, data.skills, alerts);
    }

    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (cfg && cfg.reminder)
            alerts.push({ msg: `${spec}: ${cfg.reminder}`, level: 'warn', _reminder: true });
    });

    data.active_items = [...document.querySelectorAll('#ft_fleeItemList input:checked')]
        .map(el => FT.flee_items.find(i => i.label === el.value)).filter(Boolean);

    if (data.active_items.length > FT.caps.flee_items)
        alerts.push({ msg: `Too many items (max ${FT.caps.flee_items}).`, level: 'err' });

    const missing = [];
    if (!data.size) missing.push('Size');
    if (!data.build) missing.push('Build');
    if (missing.length)
        alerts.push({ msg: `Missing: ${missing.join(', ')}.`, level: 'err' });

    render_alerts_box('ft_fleeAlerts', alerts, typos);

    if (!is_live() && !force) return;

    if (render_issues(alerts, 'ft_fleeOutput')) return;

    const calc = calculate_movement(data, false);
    const checked_items = data.active_items.map(i => i.label);
    render_movement_output('flee', data, calc, checked_items);
}

//shared specialty parser
function parse_specialties_for_form(val, form, typos, alerts) {
    const result = [];
    const ignored = [];
    const all_known = Object.keys(FT.specialties);
    const normalized = val.replace(/\band\b/gi, '&');
    const parts = normalized.split(/[&,]+/).map(p => p.trim()).filter(p => p && !is_placeholder(p));
    parts.forEach(raw => {
        const matched = fuzzy_match(raw, all_known);
        if (matched) {
            if (matched.toLowerCase() !== raw.toLowerCase())
                typos.push(`Specialty "${raw}" → "${matched}"`);
            if (!spec_has_form(matched, form)) {
                ignored.push(matched);
            } else {
                result.push(matched);
            }
        } else {
            alerts.push({ msg: `Specialty "${raw}" not recognized.`, level: 'err' });
        }
    });
    const total = result.length + ignored.length;
    if (total > 1) {
        const names = [...result, ...ignored].join(', ');
        if (ignored.length === total)
            alerts.push({ msg: `${total} specialties found (${names}), max 1. None have ${form} bonuses, all ignored.`, level: 'err' });
        else
            alerts.push({ msg: `${total} specialties found (${names}), max 1.`, level: 'err' });
    } else if (ignored.length) {
        alerts.push({ msg: `Specialty "${ignored[0]}" has no ${form} bonuses, ignored.`, level: 'info' });
    }
    return result;
}

//shared movement calculator
function calculate_movement(data, include_age) {
    const stats = { SPD: 0, STA: 0, BAL: 0 };
    const total = { value: 0 };
    const rows = [];

    function add_stat(stat, val, source) {
        stats[stat] += val;
        rows.push({ source, type: stat, val });
    }
    function add_total(val, source) {
        total.value += val;
        rows.push({ source, type: 'TOTAL', val });
    }

    if (include_age && data.age && FT.ages[data.age] && FT.ages[data.age].TOTAL) {
        add_total(FT.ages[data.age].TOTAL, `Age (${data.age})`);
    }

    if (data.size && FT.race_sizes[data.size]) {
        for (const [k, v] of Object.entries(FT.race_sizes[data.size])) {
            add_stat(k, v, 'Size');
        }
    }

    if (data.build && FT.race_builds[data.build]) {
        for (const [k, v] of Object.entries(FT.race_builds[data.build])) {
            add_stat(k, v, 'Build');
        }
    }

    (data.accessories || []).forEach(label => {
        const acc = FT.race_accessories.find(a => a.label === label);
        if (acc && acc.stat && acc.value) add_stat(acc.stat, acc.value, acc.label);
    });

    if (data.skills['Navigation']) {
        const level = data.skills['Navigation'];
        const bonus = skill_value('Navigation', level);
        if (bonus) add_total(bonus, `Navigation (${level})`);
    }

    data.specialties.forEach(spec => {
        const s = FT.specialties[spec];
        if (!s) return;
        for (const [k, v] of Object.entries(s)) {
            if (_spec_skip.includes(k)) continue;
            if (k === 'TOTAL') add_total(v, spec);
            else add_stat(k, v, spec);
        }
    });

    data.active_items.forEach(item => {
        if (item.type !== 'stat') return;
        if (item.stat && item.value) {
            if (item.stat === 'TOTAL') add_total(item.value, item.label);
            else add_stat(item.stat, item.value, item.label);
        }
    });

    return { stats, total, rows };
}

//shared movement output
function render_movement_output(type, data, calc, checked_items) {
    const box = document.getElementById(`ft_${type}Output`);
    const s = calc.stats;
    const t = calc.total;

    let msg1 = '';
    if (data.name) msg1 += `${data.name}\n`;
    if (type === 'race') msg1 += `Age: ${data.age_raw || data.age || '-'}\n`;
    msg1 += `Size: ${data.size || '-'}\n`;
    msg1 += `Build: ${data.build || '-'}\n`;
    if (data.accessories && data.accessories.length) {
        msg1 += `Accessories: ${data.accessories.join(', ')}\n`;
    }
    if (Object.keys(data.skills).length) {
        msg1 += `Skills: ${format_skills_text(data.skills, ' & ')}\n`;
    }
    if (data.specialties.length) {
        msg1 += `Specialty: ${data.specialties.join(' & ')}\n`;
    }
    if (checked_items.length) {
        msg1 += `Item: ${checked_items.join(', ')}\n`;
    }

    msg1 += `\nSpeed bonus: ${s.SPD}%\nStamina bonus: ${s.STA}%\nBalance bonus: ${s.BAL}%\nTotal score bonus: ${t.value}%\n`;

    const cmd_parts = [`!roll ${type}(${s.SPD},${s.STA},${s.BAL},${t.value})`];
    data.active_items.forEach(item => {
        if (item.type === 'append' && item.cmd) cmd_parts.push(item.cmd);
    });
    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (cfg && cfg.cmd) cmd_parts.push(cfg.cmd);
    });
    const msg2 = cmd_parts.join(' ');

    const merged = [];
    for (const row of calc.rows) {
        const existing = merged.find(r => r.source === row.source);
        if (existing) {
            if (row.type === 'TOTAL') existing.TOTAL = (existing.TOTAL || 0) + row.val;
            else existing[row.type] = (existing[row.type] || 0) + row.val;
        } else {
            const entry = { source: row.source };
            if (row.type === 'TOTAL') entry.TOTAL = row.val;
            else entry[row.type] = row.val;
            merged.push(entry);
        }
    }

    let breakdown_rows = '';
    for (const row of merged) {
        const has_neg = ['SPD','STA','BAL','TOTAL'].some(s => (row[s] || 0) < 0);
        const cls = has_neg ? ' class="ft_row_neg"' : '';
        const cells = ['SPD','STA','BAL','TOTAL'].map(stat => {
            const v = row[stat];
            if (!v) return '<td>-</td>';
            const fmt = (v > 0 ? '+' : '') + v + '%';
            return `<td>${fmt}</td>`;
        }).join('');
        breakdown_rows += `<tr${cls}><td class="ft_breakdown_source">${row.source}</td>${cells}</tr>`;
    }
    breakdown_rows += `<tr class="ft_row_total">`;
    breakdown_rows += `<td class="ft_breakdown_source">Total</td>`;
    breakdown_rows += `<td>${s.SPD}%</td><td>${s.STA}%</td><td>${s.BAL}%</td>`;
    breakdown_rows += `<td>${t.value}%</td></tr>`;

    const id = type === 'flee' ? 'ft_flee' : 'ft_race';
    box.innerHTML = `
        <div class="ft_output_wrap">
            <div class="ft_output_left">
                <div class="ft_msg_box">
                    <strong>MESSAGE ONE:</strong>
                    <pre id="${id}_msg1" class="ft_selectable ft_pre_msg ft_pre_msg1" onclick="copy_text('${id}_msg1')">${msg1}</pre>
                    <small>Click to copy</small>
                </div>
            </div>
            <div class="ft_output_right">
                <div class="ft_msg_box ft_msg_box_right">
                    <strong>MESSAGE TWO:</strong>
                    <pre id="${id}_msg2" class="ft_selectable ft_pre_msg" onclick="copy_text('${id}_msg2')">${msg2}</pre>
                    <small>Click to copy</small>
                </div>
                <strong>BREAKDOWN:</strong>
                <div class="ft_breakdown">
                    <table>
                        <tr><th class="ft_breakdown_source">Source</th><th>SPD</th><th>STA</th><th>BAL</th><th>TOTAL</th></tr>
                        ${breakdown_rows}
                    </table>
                </div>
            </div>
        </div>
    `;
    box.hidden = false;
}

function clear_flee_form() {
    document.getElementById('ft_fleeInput').value = '';
    document.querySelectorAll('#ft_fleeItemList input, #ft_fleeAccessories input').forEach(cb => cb.checked = false);
    document.getElementById('ft_fleeAlerts').hidden = true;
    document.getElementById('ft_fleeOutput').hidden = true;
    document.getElementById('ft_fleeSkillText').textContent = '--';
    document.getElementById('ft_fleeSpecDropdown').value = '';
    document.getElementById('ft_fleeSpecAlert').hidden = true;
    window._rebuild_flee_spec_dropdown(null);
}
function clear_flee_output() {
    document.getElementById('ft_fleeOutput').hidden = true;
}
function clear_flee() { clear_flee_form(); clear_flee_output(); }
function generate_flee() { parse_flee(true); }


// RACE
function auto_select_race_items(text) {
    return auto_match_items(text, FT.item_aliases, '#ft_raceItemList');
}

function scan_race() {
    const raw = document.getElementById('ft_raceInput').value.trim();
    if (!raw) return false;

    document.querySelectorAll('#ft_raceItemList input, #ft_raceAccessories input').forEach(cb => cb.checked = false);
    document.getElementById('ft_raceSkillText').textContent = '--';
    window._rebuild_race_spec_dropdown(null);

    const lines = pre_process(raw);

    for (const line of lines) {
        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            key = line.slice(0, colon_idx).trim().replace(/^\*+\s*/, '').toLowerCase();
            val = clean_val(line.slice(colon_idx + 1));
        } else {
            const colonless = line.replace(/^\*+\s*/, '').match(/^(skills?|specialty|items?|racing accessory)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase();
            val = clean_val(colonless[2]);
        }

        if ((key === 'item' || key === 'items') && val && !is_placeholder(val)) {
            auto_select_race_items(val);
        }

        if (key === 'racing accessory' && val && !is_placeholder(val)) {
            const lower = val.toLowerCase();
            FT.race_accessories.forEach(acc => {
                if (lower.includes(acc.label.toLowerCase())) {
                    const cb = document.querySelector(`#ft_raceAccessories input[value="${acc.label}"]`);
                    if (cb) cb.checked = true;
                }
            });
        }

        if (key === 'skills' && val) {
            const parsed = parse_skills(val, [], []);
            if (Object.keys(parsed).length) {
                document.getElementById('ft_raceSkillText').textContent =
                    format_skills_text(parsed);
                window._rebuild_race_spec_dropdown(parsed);
            }
        }

        if (key === 'specialty' && val && !is_placeholder(val)) {
            const rd = document.getElementById('ft_raceSpecDropdown');
            const all_known = Object.keys(FT.specialties);
            const matched = fuzzy_match(val.trim(), all_known);
            if (matched && spec_has_form(matched, 'race')) {
                rd.value = matched;
            } else {
                rd.value = '';
            }
        }
    }
    return true;
}

document.getElementById('ft_raceInput').addEventListener('input', function() {
    const raw = this.value.trim();
    if (!raw) { clear_race(); return; }
    scan_race();
    parse_race();
});

let _parsing_race = false; //reentrancy guard

function parse_race(force) {
    if (_parsing_race) return;
    _parsing_race = true;
    try { _parse_race_inner(force); } finally { _parsing_race = false; }
}

function _parse_race_inner(force) {
    const raw = document.getElementById('ft_raceInput').value.trim();
    if (!raw) return;

    const dupe_alerts = [];
    const is_dupe = detect_duplicate_form(raw, dupe_alerts);
    if (is_dupe) {
        render_alerts_box('ft_raceAlerts', dupe_alerts, []);
        if (!is_live() && !force) return;
        render_issues(dupe_alerts, 'ft_raceOutput');
        return;
    }

    const alerts = [];
    const typos = [];

    detect_wrong_tab(raw, 'race', alerts);

    const data = {
        name: '', age: '', age_raw: '', size: '', build: '',
        accessories: [], skills: {}, specialties: [],
        active_items: [],
    };

    const lines = pre_process(raw);

    const first_line = lines[0] || '';
    if (!first_line.includes(':')) {
        data.name = first_line.replace(/\s*-?\s*(race|round\s*\d+.*|vs\s.*)/gi, '').trim();
    }

    for (const line of lines) {
        const colon_idx = line.indexOf(':');
        let key, val;
        if (colon_idx !== -1) {
            key = line.slice(0, colon_idx).trim().replace(/^\*+\s*/, '');
            val = clean_val(line.slice(colon_idx + 1));
            key = key.toLowerCase().replace(/\d+/g, '').trim();
        } else {
            const colonless = line.replace(/^\*+\s*/, '').match(/^(age|size|build|skills?|specialty|items?|racing accessory)\b\s*(.*)$/i);
            if (!colonless) continue;
            key = colonless[1].toLowerCase().replace(/\d+/g, '').trim();
            val = clean_val(colonless[2]);
        }
        if (!val || is_placeholder(val)) continue;

        if (key === 'age') {
            data.age_raw = val;
            data.age = parse_age(val);
            if (!data.age)
                alerts.push({ msg: `Age "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'size') {
            const aliased = FT.size_aliases[val.toLowerCase().trim()];
            if (aliased) {
                data.size = aliased;
            } else {
                const matched = fuzzy_match(val, Object.keys(FT.race_sizes));
                if (matched) {
                    if (matched.toLowerCase() !== val.toLowerCase())
                        typos.push(`Size "${val}" → "${matched}"`);
                    data.size = matched;
                }
            }
            if (!data.size) alerts.push({ msg: `Size "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'build') {
            data.build = fuzzy_match(val, Object.keys(FT.race_builds));
            if (data.build && data.build.toLowerCase() !== val.toLowerCase())
                typos.push(`Build "${val}" → "${data.build}"`);
            if (!data.build) alerts.push({ msg: `Build "${val}" not recognized.`, level: 'err' });
        }
        else if (key === 'racing accessory') {
            const lower = val.toLowerCase();
            FT.race_accessories.forEach(acc => {
                if (lower.includes(acc.label.toLowerCase()) && !data.accessories.includes(acc.label))
                    data.accessories.push(acc.label);
            });
        }
        else if (key === 'skills') {
            data.skills = parse_skills(val, typos, alerts);
        }
        else if (key === 'specialty') {
            data.specialties = parse_specialties_for_form(val, 'race', typos, alerts);
            data._parsed_spec_names = [...data.specialties];
        }
        else if (key === 'item' || key === 'items') {
            if (val) {
                const matched = auto_select_race_items(val);
                if (!matched) alerts.push({ msg: `Item "${val}" not recognized.`, level: 'warn' });
            }
        }
    }

    data.accessories = [...document.querySelectorAll('#ft_raceAccessories input:checked')]
        .map(el => el.value);

    const selected_spec = document.getElementById('ft_raceSpecDropdown').value;
    data.specialties = selected_spec ? [selected_spec] : [];

    if (!Object.values(data.skills).some(v => v === null)) {
        validate_spec_skills(data.specialties, data.skills, alerts);
        if (!selected_spec) validate_spec_skills(data._parsed_spec_names, data.skills, alerts);
    }

    data.specialties.forEach(spec => {
        const cfg = FT.specialties[spec];
        if (cfg && cfg.reminder)
            alerts.push({ msg: `${spec}: ${cfg.reminder}`, level: 'warn', _reminder: true });
    });

    data.active_items = [...document.querySelectorAll('#ft_raceItemList input:checked')]
        .map(el => FT.race_items.find(i => i.label === el.value)).filter(Boolean);

    if (data.active_items.length > FT.caps.race_items)
        alerts.push({ msg: `Too many items (max ${FT.caps.race_items}).`, level: 'err' });

    const missing = [];
    if (!data.age && !data.age_raw) missing.push('Age');
    if (!data.size) missing.push('Size');
    if (!data.build) missing.push('Build');
    if (missing.length)
        alerts.push({ msg: `Missing: ${missing.join(', ')}.`, level: 'err' });

    render_alerts_box('ft_raceAlerts', alerts, typos);

    if (!is_live() && !force) return;

    if (render_issues(alerts, 'ft_raceOutput')) return;

    const calc = calculate_movement(data, true);
    const checked_items = data.active_items.map(i => i.label);
    render_movement_output('race', data, calc, checked_items);
}

function clear_race_form() {
    document.getElementById('ft_raceInput').value = '';
    document.querySelectorAll('#ft_raceItemList input, #ft_raceAccessories input').forEach(cb => cb.checked = false);
    document.getElementById('ft_raceAlerts').hidden = true;
    document.getElementById('ft_raceOutput').hidden = true;
    document.getElementById('ft_raceSkillText').textContent = '--';
    document.getElementById('ft_raceSpecDropdown').value = '';
    document.getElementById('ft_raceSpecAlert').hidden = true;
    window._rebuild_race_spec_dropdown(null);
}
function clear_race_output() {
    document.getElementById('ft_raceOutput').hidden = true;
}
function clear_race() { clear_race_form(); clear_race_output(); }
function generate_race() { parse_race(true); }


// QUICK ROLLS
function build_quick_roll_fields(idx) {
    const roll = FT.quick_rolls[idx];
    if (!roll) return;
    const container = document.getElementById('ft_qrFields');
    let html = '';

    (roll.sections || []).forEach((sec, si) => {
        html += `<strong>${sec.title}</strong><div class="ft_items">`;
        sec.options.forEach((opt, oi) => {
            html += `<label><input type="checkbox" data-section="${si}" data-opt="${oi}"> ${opt.label}</label>`;
        });
        html += `</div>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('input').forEach(el => {
        el.addEventListener('change', generate_quick_roll);
    });

    generate_quick_roll();
}

function generate_quick_roll() {
    const idx = +document.getElementById('ft_qrSelect').value;
    const roll = FT.quick_rolls[idx];
    if (!roll) return;

    const box = document.getElementById('ft_qrOutput');
    const cmd_parts = [roll.command];

    document.querySelectorAll('#ft_qrFields input:checked').forEach(cb => {
        const sec = roll.sections[+cb.dataset.section];
        if (sec) {
            const opt = sec.options[+cb.dataset.opt];
            if (opt && opt.cmd) cmd_parts.push(opt.cmd);
        }
    });

    box.innerHTML = `
        <div class="ft_msg_box">
            <strong>COMMAND:</strong>
            <pre id="ft_qr_cmd" class="ft_selectable ft_pre_msg" onclick="copy_text('ft_qr_cmd')">${cmd_parts.join(' ')}</pre>
            <small>Click to copy</small>
        </div>
    `;
}

function clear_quick_roll() {
    document.querySelectorAll('#ft_qrFields input[type="checkbox"]').forEach(cb => cb.checked = false);
    generate_quick_roll();
}


// TABS
function copy_text(id) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text);
}

//live vs button mode toggle
let _live_mode = false;

function is_live() {
    return _live_mode;
}

function toggle_mode() {
    _live_mode = !_live_mode;
    apply_mode();
}

function apply_mode() {
    document.getElementById('ft_modeLabel').textContent = _live_mode ? 'Live Generator' : 'Button Generator';
    document.querySelectorAll('.ft_gen_btn').forEach(b => b.hidden = _live_mode);
    document.querySelectorAll('.ft_live_btn').forEach(b => b.hidden = !_live_mode);
    try { localStorage.setItem('ft_live_mode', _live_mode ? '1' : '0'); } catch(e) {}
    if (_live_mode) {
        if (document.getElementById('ft_fightInput').value.trim()) { scan_fight(); parse_fight(true); }
        if (document.getElementById('ft_fleeInput').value.trim()) { scan_flee(); parse_flee(true); }
        if (document.getElementById('ft_raceInput').value.trim()) { scan_race(); parse_race(true); }
    }
}

function switch_tab(id, btn) {
    document.querySelectorAll('.ft_tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.ft_con').forEach(d => d.hidden = true);
    document.getElementById(id).hidden = false;
}

window.addEventListener('load', () => {
    try {
        const saved = localStorage.getItem('ft_live_mode');
        if (saved === '1') _live_mode = true;
    } catch(e) {}
    apply_mode();
    clear_fight(); clear_flee(); clear_race(); clear_quick_roll();
});
