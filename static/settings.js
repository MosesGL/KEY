$(document).ready(function() {
    if (config == undefined) {
        config = getConfig();
    }
    setPlaceholders();

    // Set new JSON information
    function setConfig(key, value) {
        // Send song info to main app.py to save
        $.ajax({
            async: false,
            url: '/set_config',
            data: JSON.stringify([key, value]),
            contentType: 'application/json;charset=UTF-8',
            type: 'POST'
        });
    }
    // Get config information
    function getConfig() {
        config = $.ajax({
            async: false,
            url: "/get_config",
            type: "GET",
            dataType: "json"
        }).responseText;
        return JSON.parse(config);
    }

    // Set placeholder values for each config
    function setPlaceholders() {
        // Convert use_sharps bool to a 0-1 index (true=1,false=0)
        $('#use_sharps').prop('selectedIndex',config['use_sharps'] ? 1 : 0);
        $('#wait_for_note').prop('checked', config['wait_for_note']);
        $('#update_precision').attr('value',config['update_precision']);
        //  =/1000 converts sec to ms
        $('#note_interval').attr('value',config['note_interval']/1000);
        $('#display_spacing_notes').attr('value',config['display_spacing_notes']);
        $('#nsong_spacing_notes').attr('value',config['nsong_spacing_notes']);
    }

    // When inputs are updated
    $('#use_sharps').on('change',function() {
        var value = $(this).prop('selectedIndex')==1;
        // Update config
        config['use_sharps'] = value;
        // index of 1 is sharp selection
        setConfig('use_sharps',value);
    });
    $('#wait_for_note').on('change',function() {
        var value = $(this).is(':checked');
        // Update config
        config['wait_for_note'] = value;
        setConfig('wait_for_note',value);
    });
    $('#update_precision').on('change',function() {
        var value = parseInt($(this).val());
        // Update config
        config['update_precision'] = value;
        setConfig('update_precision',value);
    });
    $('#note_interval').on('change',function() {
        // =*1000 converts sec to ms
        var value = parseFloat($(this).val()) * 1000;
        // Update config
        config['note_interval'] = value;
        setConfig('note_interval',value);
    });
    $('#display_spacing_notes').on('change',function() {
        var value = parseInt($(this).val());
        // Update config
        config['display_spacing_notes'] = value;
        setConfig('display_spacing_notes',value);
    });
    $('#nsong_spacing_notes').on('change',function() {
        var value = parseInt($(this).val());
        // Update config
        config['nsong_spacing_notes'] = value;
        setConfig('nsong_spacing_notes',value);
    });
});