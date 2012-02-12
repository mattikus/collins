function elId(e) {
  if (!e) {
    return;
  } else if (e.charAt(0) != '#') {
    return '#' + e;
  } else {
    return e;
  }
};

function getLabelSpan(msg, label) {
  return '<span class="label ' + label + '">' + msg + '</span>';
};
 
$(document).ready(function() {
  // Given an input element, find the next input in the form and focus it
  function focusNextInput(e) {
    // Use an :eq selector to find the input having an index one more than the current element
    var next = $(":input:eq(" + ($(":input").index(e) + 1) + ")");
    next.focus();
  };

  // Setup alert boxes to be dismissable
  $(".alert-message[data-alert]").alert();

  // focus input elements with a focus class
  $("input.focus").focus();

  // attach a date handler to appropriate inputs
  $("input[data-type=date]").dateinput({
    format: 'yyyy-mm-dd',
    change: function() {
      var isoDate = this.getValue('yyyy-mm-dd') + 'T00:00:00'
      this.getInput().val(isoDate);
    }
  });

  // Attach a keypress handler that moves to the next input on enter
  $("input[enter-style=tab]").each(function() {
    var e = $(this);
    e.keypress(function(event) {
      if (event.which == 10 || event.which == 13) {
        event.preventDefault();
        focusNextInput(event.target);
      }
    });
  });

  // Captures alt-key value in a string and advances to specified href once
  // entered. e.g <a data-altkey="yes" href="/step2">Yes</a>
  // would send you to /step2 when you typed in 'yes'
  $("[data-altkey]").each(function() {
    var e = $(this);
    var altKey = e.attr('alt-key').toLowerCase();
    var keyLen = altKey.length;
    var soFar = "";
    $(document).keypress(function(event) {
      if (event.which == 10 || event.which == 13) {
        if (soFar.slice(soFar.length - keyLen).toLowerCase() == altKey) {
          window.location=$(e).attr('href')
        }
      } else {
        soFar = soFar + String.fromCharCode(event.which);
      }
    });
  });

  // if this is clicked it should close a modal
  $("[data-closes-modal]").each(function() {
    var e = $(this);
    var toClose = $(elId(e.attr('data-closes-modal')));
    e.click(function() {
      toClose.modal('hide');
    });
  });

  // Bind to a modals hide event, resetting a form if it exists, and cleaning up
  // the referenced element.
  $("[data-modal-cleanup]").each(function() {
    var e = $(this);
    var toClean = $(elId(e.attr('data-modal-cleanup')));
    e.bind('hide', function() {
      e.children('form').each(function() { this.reset() });
      toClean.each(function() { $(this).empty().hide() });
    });
  });

  var refresher = function(selector) {
    if (selector) {
      $(selector).each(function() { $(this).trigger('refresh') });
    }
  }

  // handles ajaxy forms, can manage modals, data refreshes, and errors.
  $("form[data-form]").each(function() {
    var e = $(this);
    e.submit(function(target) {
      target.preventDefault();
      $(target).attr('disabled', 'disabled');
      var $form = $(this),
                  form = this,
                  url = $form.attr('action'),
		  data = $form.serialize(),
		  modalEl = $form.attr('data-modal'),
		  errorEl = $form.attr('data-error'),
		  refreshSelector = $form.attr('data-refresh');

      $.post(url, data).success(function(d) {
	form.reset();
        if (errorEl) {
	  $(elId(errorEl)).empty().hide();
	}
	if (modalEl) {
	  $(elId(modalEl)).modal('hide');
	}
        refresher(refreshSelector);
      }).error(function(d) {
	var response = JSON.parse(d.responseText);
	if (errorEl) {
          $(elId(errorEl)).empty().append(response.data.message).show();
	} else {
	  alert(response.message);
	}
      }).complete(function() {
        $(target).removeAttr('disabled');
      });
    });
  });

  // simple buttons for interacting with ajax services.
  $("button[data-remote]").each(function() {
    var e = $(this);
    var remoteUrl = e.attr('data-remote');
    var method = e.attr('data-method') || 'GET';
    var refreshSelector = e.attr('data-refresh');
    e.click(function() {
      $.ajax({
        type: method,
        url: remoteUrl,
        success: function(o) {
          refresher(refreshSelector);
        }
      });
    });
  });

  // Makes elements with a data-collapsable attribute collapsible.
  // e.g. <h3><a data-collapsible
  $("[data-collapsible]").each(function() {
    var e = $(this);
    var target = elId(e.attr('data-collapsible'));
    var startCollapsed = $(target).hasClass('collapsed')
    if (startCollapsed) {
      $(target).hide();
    }
    e.click(function() { $(target).toggle() });
  });

  // Binds a click handler to something with a data-toggle=collapseAll attribute. Collapses
  // all elements that have a 
  $("[data-toggle=collapseAll]").each(function() {
    $(this).click(function() {
      $("[data-collapsible]").each(function() {
        $(elId($(this).attr('data-collapsible'))).hide();
      });
    });
  });

  $("[data-toggle=openAll]").each(function() {
    $(this).click(function() {
      $("[data-collapsible]").each(function() {
        $(elId($(this).attr('data-collapsible'))).show();
      });
    });
  });

  var fnLogProcessing = function(oTable) {
    // fnPagingInfo resolves which object contains our paging info, since for some reason
    // fnReloadAjax swaps it on refresh.
    var fnPagingInfo = function(that) {
      if (that && that.fnPagingInfo) {
        return that.fnPagingInfo();
      } else {
	return oTable().fnPagingInfo();
      }
    };
    return function (sSource, aoData, fnCallback) {
      var paging = fnPagingInfo(this);
      aoData.push( {"name": "page", "value": paging.iPage} );
      aoData.push( {"name": "size", "value": paging.iLength} );
      var sortDir = "DESC";
      for (var i = 0; i < aoData.length; i++) {
        if (aoData[i].name == "sSortDir_0") {
	  sortDir = aoData[i].value;
          break;
        }
      }
      aoData.push( {"name": "sort", "value": sortDir} );
      $.ajax( {
        "dataType": 'json',
        "type": "GET",
        "url": sSource,
        "data": aoData,
        "success": function(json) {
          json.iTotalRecords = json.data.Pagination.TotalResults;
          json.iTotalDisplayRecords = json.iTotalRecords;
          fnCallback(json);
        }
      });
    };
  };

  var formatLogRow = function(typeLocation) {
    var errors = ["EMERGENCY", "ALERT", "CRITICAL"];
    var warnings = ["ERROR", "WARNING"];
    var notices = ["NOTICE","NOTE"];
    var success = ["INFORMATIONAL"];
    return function(nRow, aData, iDisplayIndex) {
      if (typeLocation !== false) {
        var selector = 'td:eq(' + typeLocation + ')';
        var dtype = aData.TYPE;
        if ($.inArray(dtype, errors) > -1) {
          $(selector, nRow).html(getLabelSpan(dtype, "important"));
        } else if ($.inArray(dtype, warnings) > -1) {
          $(selector, nRow).html(getLabelSpan(dtype, "warning"));
        } else if ($.inArray(dtype, notices) > -1) {
          $(selector, nRow).html(getLabelSpan(dtype, "notice"));
        } else if ($.inArray(dtype, success) > -1) {
          $(selector, nRow).html(getLabelSpan(dtype, "success"));
        } else {
          $(selector, nRow).html(getLabelSpan(dtype, ""));
        }
      }
      return nRow;
    };
  };

  // Handles rendering tables of log data, requires that the table have a log-data
  // CSS class and a data-source attribute specifying the URL for data. Also requires
  // a JavaScript variable named in the data-cols attribute. The JS variable specifies
  // the aoColumns value.
  $('table.log-data[data-source]').each(function() {
    var e = $(this);
    var oTable;
    var dataSrc = e.attr('data-source');
    var columns = window[e.attr('data-cols')];
    var rows = e.attr('data-size') || 10;

    var typeLocation = false;
    $.each(columns, function(i, v) {
      if (v.mDataProp == 'TYPE') {
        typeLocation = i;
      }
    });

    oTable = e.dataTable({
      "bProcessing": true,
      "bServerSide": true,
      "bAutoWidth": false,
      "bFilter": false,
      "sAjaxSource": dataSrc,
      "aaSorting": [[0, "desc"]],
      "sPaginationType": "bootstrap",
      "sDom": "<'row'<'span7'l><'span7'f>r>t<'row'<'span7'i><'span7'p>>",
      "iDisplayLength": rows,
      // Need late binding for oTable since it's not assigned yet
      "fnServerData": fnLogProcessing(function() { return oTable; }),
      "sAjaxDataProp": "data.Data",
      "aoColumns": columns,
      "fnRowCallback": formatLogRow(typeLocation),
    });

    // Bind a refresh event to the table
    e.bind('refresh', function() {
      oTable.fnReloadAjax();
    });

  });

  // hack so data-refresh can be "window"
  $("body").append("<div class='hide window' id='window'></div>");
  $('#window,.window').bind('refresh', function() {
    window.location.reload();
  });

})
