nomeArea = "VEÍCULOS";
var _cod = [['marca'], ['modelo'], ['ano'], ['codigo'], ['codigoano']];
var _indices = ['idSelectMarca', 'idSelectModeloVeiculo', 'idSelectAno', 'idSelectCodigo', 'idSelectCodigoAno'];
var _config = new Array();
var _urlBase = '';
var _tabRefCorrenteAno = '';
var _tabRefCorrentMes = '';
var _timeout = 10000;
var _urlRota = '';
var acessoUrl = false; // validar se é acesso direto da url
var surl = urlApi + '/';
var _codTabelaAtual = 0;

var id = '';
var elemento = '';
$(window).on('load', function () {

    if (document.location.href.indexOf("?") > -1) {
        try {
            acessoUrl = true;

            var urlParametro = document.location.href.split("?")[1];
            var parametros = urlParametro.split("/");
            var autenticacao = parametros[6].indexOf('#') > -1 ? parametros[6].substr(0, parametros[6].indexOf('#')) : parametros[6];
            var dados = {
                tipo: parametros[0], marca: parametros[1], mesreferencia: parametros[2],
                codigofipe: parametros[3], ano: parametros[4], combustivel: parametros[5],
                autenticacao: autenticacao
            };

            elemento = "buttonPesquisar" + parametros[0] + "PorCodigoFipe";
            $("#" + elemento).hide();
            loading(elemento, 'start');

            crossDomainAjax(surl + 'VeiculoFiltro', dados, function (data) {
                var erro = data.erro;
                var tipo = tipoVeiculoUrl()
                var hash = ('#' + tipo + '&' + tipo + '-codigo').toLowerCase();
                if (window.location.hash.indexOf(hash) == -1)
                    window.location.href += hash;

                if (erro == null || erro == undefined) {
                    veiculo = data;

                    scrollToElement('[data-slug="' + tipo + '"]');

                    id = "input#selectCodigo" + tipo + "CodigoFipe";
                    idTabRef = "#selectTabelaReferencia" + tipo + "CodigoFipe";

                    $(id).val(veiculo.CodigoFipe.toString());
                    $(idTabRef).val(veiculo.CodigoHistorico.toString());
                    $(idTabRef).trigger("chosen:updated");


                    $("#selectCodigoAno" + tipo + "CodigoFipe").attr('data-valor', veiculo.AnoModelo);
                    setTimeout('$(id).trigger("blur");acessoUrl = false;$("#" + elemento).show();loading(elemento, "stop");', 1200)
                } else {
                    $("#buttonPesquisar" + tipo + "PorCodigoFipe").show();
                    loading(elemento, 'stop');
                }

            });
        } catch (e) {
            $("#buttonPesquisar" + tipo + "PorCodigoFipe").show();
            loading(elemento, 'stop');
        }
    }

});

function clearPesquisa(_obj) {
    $('.button.pesquisa.clear').hide();
    scrollToElement($('li.open').eq(0));
    zerarVariaveis();
    pesquisaPorCodigo = false;

    if ($(_obj).attr('id').indexOf('CodigoFipe') > -1)
        pesquisaPorCodigo = true;

    loadMarcas($('article[config][idbuttonclear=' + $(_obj).attr('id') + ']'), pesquisaPorCodigo);
}

function loadMarcas(_obj, pesquisaPorCodigo) {

    $(".chosen-select").attr('disabled', true).trigger("chosen:updated");

    if (!acessoUrl) {

        $('.input[config=' + $(_obj).attr('config') + ']').each(function () {
            $(this).children('select').html('<option value=""></option>');

            if (!jQuery.browser.mobile && !$('#mobile').is(':visible')) {
                $(this).children('select').trigger("chosen:updated");
                $(this).children('input').val("");
            }

            _cod[$(this).children('select').data('tipo')] = '';
        });

        $('[data-tipo=resultadoConsulta]').html('');
        $('.button.pesquisa.clear').hide();
    }

    var _item = $(_obj).find('[data-selectmarca]');
    var mesAno = $('#' + idSelectTabRefTarget).val();

    // Seleciona em um input do tipo select a option que contém a tabela de referencia selecionada pelo usuário
    var idSelectTabRefTarget = $(_item).data('tabref');
    // Pega o código da cotação:
    var codTabRef = $('#' + idSelectTabRefTarget).val();
    if (codTabRef == null || codTabRef == undefined || codTabRef.length == 0) {
        codTabRef = _codTabelaAtual;
        $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
        return;
    }

    var codTipVeiculo = $(_obj).attr('codTipoVeiculo');

    //AUTOCOMPLETE
    // Limpa as opções das marcas:
    var idSelectTabRefTarget = $(_item).data('selectmarca');

    if ($.trim(idSelectTabRefTarget) !== '') {
        var $selectTabRefTarget = $('#' + idSelectTabRefTarget);

        loading(idSelectTabRefTarget, "start");

        if (!pesquisaPorCodigo) {
            data = { codigoTabelaReferencia: codTabRef, codigoTipoVeiculo: codTipVeiculo }
            crossDomainAjax(surl + 'ConsultarMarcas', data,
                function (data) {
                    // verifica se há dados retornados
                    if (!IsNullOrUndefined(data.erro) || (IsNullOrUndefined(mesAno) && IsNullOrUndefined(codTabRef))) {
                        showModal('<p>Dados não encontrados para a tabela de referência selecionada.</p>', true);
                        $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
                        loading(idSelectTabRefTarget, "stop");
                    } else {
                        //var tags = $.map(data, function (a) { return { value: a.NomeMarca, codigo: a.CodigoMarca }; });
                        var tags = $.map(data, function (a) { return { value: a.Label, codigo: a.Value }; });
                        initAutocomplete(idSelectTabRefTarget, tags, 'marca');
                    }
                },
                function (x, t, m) {
                    loading(idSelectTabRefTarget, "stop");
                    showModal('<p>Sistema Indisponível. Tente novamente em alguns minutos.</p>', true);
                    $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
                });

        } else {
            loading(idSelectTabRefTarget, "stop");
            $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
        }
    }

}

function carregarTabelaReferencia(_item) {
    var idSelectTabRefTarget = _item;

    crossDomainAjax(surl + 'ConsultarTabelaDeReferencia', null,
        function (data) {
            // verifica se há dados retornados
            if (!IsNullOrUndefined(data.erro)) {
                showModal('<p>Tabela de referência indisponível. Tente novamente mais tarde.</p>', true);
                $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
                loading(idSelectTabRefTarget, "stop");
            } else {
                var id = "#" + idSelectTabRefTarget;
                $(id).html('');
                var options = "";
                $.each(data, function (j, i) {
                    if (_codTabelaAtual == 0)
                        _codTabelaAtual = i.Codigo;
                    options += '<option value="' + i.Codigo + '">' + i.Mes + '</option>';
                });
                $(id).html(options);
                $(".chosen-select").trigger("chosen:updated");
                setTimeout(loadMarcas($(id).closest('article.open'), false), 3000);
            }
        },
        function (x, t, m) {
            showModal('<p>Sistema Indisponível. Tente novamente em alguns minutos.</p>', true);
            $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
        });

}

function loadOptions(_obj) {
    //console.log($(_obj).parent().attr('tipoConsulta'));
    if ((_cod['modelo'] == '' || _cod['ano'] == '') && $(_obj).parent().attr('tipoConsulta') != 'codigo') {
        $(".chosen-select").attr('disabled', true).trigger("chosen:updated");
    }

    if ($(_obj).parent().attr('urlConsulta') != '') {
        if ($(_obj).val() == '') {
            _config[$(_obj).data('tipo')] == '';
        } else {
            //Load Ano/Modelo
            var _item = $('article[config=' + $(_obj).parent().attr('config') + '][tipoConsulta=' + $(_obj).parent().attr('tipoConsulta') + ']');
            // adiciona o loading nos selects
            if (_cod['modelo'] == '') {
                loading($(_item).attr('idSelectModeloVeiculo'), "start");
            }
            if (_cod['ano'] == '') {
                loading($(_item).attr('idSelectAno'), "start");
            }

            //  zerarVariaveis();
            $('.button.pesquisa.clear').hide();

            var codigoTabelaReferencia = $('#' + $(_item).attr('idSelectTabelaRef')).val();

            var parametros = {
                codigoTipoVeiculo: $(_item).attr('codTipoVeiculo'),
                codigoTabelaReferencia: codigoTabelaReferencia,
                codigoModelo: _cod['modelo'],
                codigoMarca: _cod['marca'],
                ano: _cod['ano'],
                codigoTipoCombustivel: _cod['ano'] != '' ? _cod['ano'].split('-')[1] : '',
                anoModelo: _cod['ano'] != '' ? _cod['ano'].split('-')[0] : '',
                modeloCodigoExterno: _cod['codigo'] != '' ? _cod['codigo'] : ''
            }


            crossDomainAjax(surl + $(_obj).parent().attr('urlConsulta'), parametros, function (data) {


                //Autocomplete
                //Ano/Modelo
                var tags;

                // se for pesquisa por código zera o drop de ano modelo
                if ($(_item).attr('tipoConsulta') == 'codigo') {
                    var selectAno = '#' + $(_item).attr('idselectcodigoano');
                    $(selectAno).html('<option value=""></option>');
                    $(selectAno).trigger("chosen:updated");
                }

                if (!IsNullOrUndefined(data.erro)) {
                    var nomeVeiculo = $(_obj).data('nomeveiculo')

                    if ($(_item).attr('tipoConsulta') == 'tradicional') {
                        textoErro = '<p>Dados não encontrados para a pesquisa realizada.</p>';
                    } else {
                        textoErro = '<p>Código Fipe ' + _cod['codigo'] + ' não localizado.<br>Pesquisa realizada em ' + nomeVeiculo + '.</p>';
                        if (data.codigo == '3') {
                            textoErro = '<p>Código Fipe inválido. Por favor, utilize o padrão 000000-0.</p>';
                        }
                    }
                    showModal(textoErro, true);

                    trackEvent("pesquisa_veiculos", "erro_com_codigo", tipoVeiculo(parametros.codigoTipoVeiculo));

                    $('#' + $(_item).attr('idSelectTabelaRef')).trigger('change');
                    loading($(_item).attr('idSelectModeloVeiculo'), "stop");
                    loading($(_item).attr('idSelectAno'), "stop");

                } else {

                    if ($(_item).attr('tipoConsulta') == 'tradicional') {
                        tags = $.map(data, function (a) { return { value: a.Label, codigo: a.Value }; })

                        var log = '';
                        log = log + "||ano:" + _cod['ano'].toString();
                        log = log + "||tipo:" + $(_obj).data('tipo');
                        log = log + "||modelo:" + _cod['modelo'].toString();

                        ////console.log(log);

                        //if ($(_obj).data('tipo') == 'modelo' && _cod['ano'] == '') {
                        if ($(_obj).data('tipo') == 'modelo') {
                            $('#' + $(_item).attr('idSelectAno')).attr('data-valor', _cod['ano']);
                            initAutocomplete($(_item).attr('idSelectAno'), tags, 'ano');
                        } else if ($(_obj).data('tipo') == 'ano') {
                            //} else if ($(_obj).data('tipo') == 'ano' && _cod['modelo'] == '') { 
                            $('#' + $(_item).attr('idSelectModeloVeiculo')).attr('data-valor', _cod['modelo']);
                            initAutocomplete($(_item).attr('idSelectModeloVeiculo'), tags, 'modelo');
                        } else if (($(_obj).data('tipo') == 'marca')) {
                            tags = $.map(data.Anos, function (a) { return { value: a.Label, codigo: a.Value }; });
                            initAutocomplete($(_item).attr('idSelectAno'), tags, 'ano');

                            tags = $.map(data.Modelos, function (a) { return { value: a.Label, codigo: a.Value }; })
                            initAutocomplete($(_item).attr('idSelectModeloVeiculo'), tags, 'modelo');
                        }
                    } else {

                        tags = $.map(data, function (a) { return { value: a.Label, codigo: a.Value }; });
                        initAutocomplete($(_item).attr('idSelectCodigoAno'), tags, 'codigoano');
                    }
                }
            },
                function (x, t, m) {
                    if (t === "timeout") {
                        showModal('<p>Sistema Indisponível. Tente novamente em alguns minutos.</p>', true);
                        loading($(_item).attr('idDivResultado'), "stop");
                    } else {
                        loading($(_item).attr('idSelectModeloVeiculo'), "stop");
                    }

                    trackEvent("pesquisa_veiculos", "erro_com_codigo", tipoVeiculo(parametros.codigoTipoVeiculo));

                    loading($(_item).attr('idSelectModeloVeiculo'), "stop");
                    loading($(_item).attr('idSelectAno'), "stop");
                });

        }
    }
}

$(function () {

    $('select[name="selectTabelaReferencia"]').change(function () {
        $(this).parent().find('input[name="txtCodigoFipe"]').val('');
        $(this).parent().find('[data-tipo=codigoano]').html('').trigger("chosen:updated");
        $('[data-tipo=resultadoConsulta]').html('');
        $('.button.pesquisa.clear').hide();
    });

    _urlBase = $('#urlBase').val();
    _urlRota = $('#urlRota').val();

    $('.button.pesquisa').each(function () {
        $(this).children('a').click(function () {
            $(this).parent().hasClass('clear') ? clearPesquisa($(this).parent()) : consultarPrecoComTodosParametros(this);
        });
    });

    if (!jQuery.browser.mobile && !$('#mobile').is(':visible')) {
        var config = {
            '.chosen-select': {},
            '.chosen-select-deselect': { allow_single_deselect: true },
            '.chosen-select-no-single': { disable_search_threshold: 10 },
            '.chosen-select-no-results': { no_results_text: 'Nenhum resultado encontrado' },
            '.chosen-select-width': { width: "95%" }
        }
        for (var selector in config) {
            $(selector).chosen(config[selector]);
        }
    }

    //Calendários
    // Carrega as opções dos calendários
    _tabRefCorrenteAno = $('#tabelaReferenciaAtualAno').val();
    _tabRefCorrentMes = $('#tabelaReferenciaAtualMes').val();

    $('[data-selectmarca]').bind('change', function (e) {
        if ($(this).closest('article.open').is('[tipoconsulta=tradicional]')) {
            loadMarcas($(this).closest('article.open'));
        }
        $('.button.clear').hide();
    });


    _cod['marca'] = '';
    _cod['modelo'] = '';
    _cod['ano'] = '';
    _cod['codigo'] = '';
    _cod['codigoano'] = '';

    //Gera object
    $('article[config]').each(function () {
        var a = new Array();
        $.each(this.attributes, function () {
            if (this.specified) {
                a[this.name.toLowerCase()] = this.value;
            }
        });
        if (a != null && a != undefined)
            _config.push(a);
    });

    //Cria os eventos para os inputs
    for (var i = 0; i < _config.length; i++) {
        //loadMarcas($('article[tipoconsulta=tradicional][config=' + _config[i]['config'] + ']'));
        for (var k = 0; k < _indices.length; k++) {
            var obj = $('#' + _config[i][_indices[k].toLowerCase()]);
            if (obj != null && obj != undefined) {
                if (obj.is('[type=text]')) {
                    $(obj).blur(function () {
                        $('[data-tipo=resultadoConsulta]').html('');
                        $('.button.pesquisa.clear').hide();

                        var valorItem = $(this).val();
                        valorItem = valorItem.replace("_", "");
                        //if (valorItem.length < 7 || valorItem.length > 8) { valorItem = ''; }
                        _cod[$(this).data('tipo')] = valorItem;
                        if (valorItem == '') {
                            showModal('<p>Favor informar um Código Fipe válido.</p>', true);
                        }
                        loadOptions(this);
                    });
                } else {
                    $(obj).change(function () {
                        $('[data-tipo=resultadoConsulta]').html('');
                        $('.button.pesquisa.clear').hide();
                        _cod[$(this).data('tipo')] = $(this).val()
                        loadOptions(this);
                    });
                }
            }
        }
    }

    if ($.isFunction($.fn.mask)) {
        $('.maskCodigoFipe').mask('999999-9');
    }

    $('.step-2 .help').tooltip({
        content: '<strong class="blue">Importante:</strong> Para realizar a sua busca, você deve selecionar primeiro a marca do veículo. Depois, selecione o <strong>modelo</strong> e o <strong>ano modelo</strong> na <strong>ordem que desejar</strong>.',
        position: {
            my: "left-403 center",
            at: "left center",
            using: function (position, feedback) {
                $(this).css(position);
                $('<div>')
                    .addClass('arrow')
                    .appendTo(this);
            }
        }
    });

    $('.step-2 .help').on('click', function (event) {
        event.preventDefault();
    });
});

function zerarVariaveis() {
    _cod['marca'] = '';
    _cod['modelo'] = '';
    _cod['ano'] = '';
    _cod['codigo'] = '';
    _cod['codigoano'] = '';
}

/**
* Retorna o preço médio do veículo através do código da Cotação.
* param idSelectAno {string} Id do input que possuí o valor do código da cotação.
*/
function consultarPrecoComTodosParametros(sender) {
    var parametros;
    var idDivResultado = $('article[config][idButton=' + sender.id + ']').attr('iddivresultado');
    var tipoVeiculo = $('article[config][idButton=' + sender.id + ']').attr('tipoveiculo');
    var tipoConsulta = $('article[config][idButton=' + sender.id + ']').attr('tipoconsulta');

    $('[data-tipo=resultadoConsulta]').html('');
    //$('#' + idDivResultado).html('<div class="loader"></div>');

    if (tipoConsulta == 'codigo') {
        if (_cod['codigo'] == '' || _cod['codigoano'] == '') {
            showModal('<p>Favor informar Código Fipe e Ano Modelo</p>', true);
            trackEvent("pesquisa_veiculos", "erro_obrigatorio_com_codigo", tipoVeiculo);
            return false;
        }
    } else {
        _cod['codigo'] = '';
        if (_cod['marca'] == '' || _cod['modelo'] == '' || _cod['ano'] == '') {
            showModal('<p>Todos os campos são obrigatórios</p>', true);
            trackEvent("pesquisa_veiculos", "erro_obrigatorio_sem_codigo", tipoVeiculo);
            return false;
        }
    }

    var anoModelo = tipoConsulta == 'codigo' ? _cod['codigoano'].split('-')[0] : _cod['ano'].split('-')[0];
    var tipoCombustivel = tipoConsulta == 'codigo' ? _cod['codigoano'].split('-')[1] : _cod['ano'].split('-')[1];

    parametros = {
        codigoTabelaReferencia: $('#' + $('article[config][idButton=' + sender.id + ']').attr('idSelectTabelaRef')).val(),
        codigoMarca: _cod['marca'],
        codigoModelo: _cod['modelo'],
        codigoTipoVeiculo: $('article[config][idButton=' + sender.id + ']').attr('codTipoVeiculo'),
        anoModelo: anoModelo,
        codigoTipoCombustivel: tipoCombustivel,
        tipoVeiculo: tipoVeiculo,
        modeloCodigoExterno: tipoConsulta == 'codigo' ? _cod['codigo'] : '',
        tipoConsulta: tipoConsulta
    };

    // Esconde o botão de pesquisar
    //MUDAR AQUI
    $(sender).hide();

    loading(idDivResultado, "start-inside");

    var tabelaHtmlTemplate = $('#tabelaResultadoPesquisa').html();

    if (tipoConsulta == 'codigo') {
        textoErroTracker = 'erro_com_codigo';
        textoTracker = 'sucesso_com_codigo';
        pageViewTracker = "/indices-e-indicadores/veiculos/" + tipoVeiculo + "/resultado/com_codigo"
    } else {
        textoErroTracker = 'erro_sem_codigo';
        textoTracker = 'sucesso_sem_codigo';
        pageViewTracker = "/indices-e-indicadores/veiculos/" + tipoVeiculo + "/resultado/sem_codigo"
    }

    crossDomainAjax(surl + $('article[config][idButton=' + sender.id + ']').attr('urlPesquisa'), parametros,
        function (data) {
            if (data != '' && IsNullOrUndefined(data.erro)) {

                var anoModelo = ""
                if (data.TipoVeiculo == '2' || data.TipoVeiculo == '3') { //se for moto ou caminhão não imprime o combustível
                    anoModelo = converterZeroKM(data.AnoModelo.toString(), data.TipoVeiculo);
                } else {
                    anoModelo = converterZeroKM(data.AnoModelo.toString(), data.TipoVeiculo) + ' ' + data.Combustivel;
                }


                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{mes-de-referencia}', data.MesReferencia);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{codigo-fipe}', data.CodigoFipe);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{marca}', data.Marca);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{modelo}', data.Modelo);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{ano-modelo}', anoModelo);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{preco-medio}', data.Valor);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{data-consulta}', data.DataConsulta);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{autenticacao}', data.Autenticacao);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{combustivel}', data.SiglaCombustivel);
                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{tipo}', data.TipoVeiculo);

                var anoMes = trimValue($('article[config][idButton=' + sender.id + ']').find('[data-tipo="referencia"]').find('option:selected').text());

                anoMes = anoMes.split('/')

                var link = '{urlbase}{rota}?{tipo}/{marca}/{mesreferencia}/{codigo-fipe}/{ano-modelo}/{combustivel}/{autenticacao}';
                link = link.replace('{urlbase}', siteUrl);
                link = link.replace('{rota}', _urlRota);
                link = link.replace('{tipo}', tipoVeiculo);
                link = link.replace('{marca}', slug(data.Marca));
                link = link.replace('{mesreferencia}', converterMesInt(anoMes[0]) + '-' + anoMes[1]);
                link = link.replace('{codigo-fipe}', data.CodigoFipe != undefined ? trimValue(data.CodigoFipe) : data.CodigoFipe);
                link = link.replace('{ano-modelo}', data.AnoModelo);
                link = link.replace('{combustivel}', data.SiglaCombustivel);
                link = link.replace('{autenticacao}', data.Autenticacao);
                link = link.replace(/\s+/g, '');

                pageViewVeiculo = pageViewVeiculos(data, anoMes, tipoVeiculo, tipoConsulta);
                if (pageViewVeiculo != '')
                    trackPageView(pageViewVeiculo);

                tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{url-link}', link.toLowerCase());

                $('#' + idDivResultado).html(tabelaHtmlTemplate); // Popula a div de resultado
                scrollToElement('#' + idDivResultado);
                $(sender).show(); // Reexibe o botão de pesquisar

                $('#' + $('article[config][idButton=' + sender.id + ']').attr('idbuttonclear')).show();

                trackEvent("pesquisa_veiculos", textoTracker, tipoVeiculo);
                //trackPageView(pageViewTracker);

            } else {

                if (data.codigo == '99') {
                    tabelaHtmlTemplate = '<p>Você realizou a quantidade máxima de pesquisas. Para continuar, recarregue a página.</p>';
                    trackEvent("pesquisa_veiculos", "sessao_expirada", tipoVeiculo);
                    $(".loader").hide();
                } else if (data.codigo == '3') {
                    tabelaHtmlTemplate = '<p>Código fipe inválido. O padrão é 000000-0.</p>';
                    trackEvent("pesquisa_veiculos", textoErroTracker, tipoVeiculo);
                }
                else {
                    tabelaHtmlTemplate = '<p>Sistema Indisponível. Tente novamente em alguns minutos</p>';
                    trackEvent("pesquisa_veiculos", textoErroTracker, tipoVeiculo);
                }

                trackEvent("pesquisa_veiculos", textoErroTracker, tipoVeiculo);

                $(sender).show(); // Reexibe o botão de pesquisar
                showModal(tabelaHtmlTemplate, true); // Popula a div de resultado

            }
        },
        function (x, t, m) {
            if (t === "timeout") {
                tabelaHtmlTemplate = '<p>Sistema Indisponível. Tente novamente em alguns minutos.</p>';
                showModal(tabelaHtmlTemplate, true); // Popula a div de resultado

                trackEvent("pesquisa_veiculos", "timeout", tipoVeiculo);
            } else {
                tabelaHtmlTemplate = '<p>Sistema Indisponível. Tente novamente em alguns minutos</p>';
                showModal(tabelaHtmlTemplate, true); // Popula a div de resultado

                trackEvent("pesquisa_veiculos", textoErroTracker, tipoVeiculo);
            }

            $(sender).show(); // Reexibe o botão de pesquisar
        });
}

function trimValue(valor) {
    if (valor != null && typeof trim == "function")
        return valor.trim()

    return valor;
}


/**
* Retorna o preço médio do veículo através do código da Cotação.
* param idSelectAno {string} Id do input que possuí o valor do código da cotação.
*/
function consultarPreco(idSelectAno, urlBase, idDivResultado, codigoTipoVeiculo, idBotaoPesquisa) {

    // Remove resultado anterior se tiver
    loading(idDivResultado, "start");

    var codigoCotacao = $('#' + idSelectAno).val();

    // Verifica se existe um código de ano modelo
    if ($.trim(codigoCotacao) === '') {
        loading(idDivResultado, "stop");
        return;
    }

    // Esconde o botão de pesquisar
    $('#' + idBotaoPesquisa).hide();

    data = { codigoCotacao: codigoCotacao, codigoTipoVeiculo: codigoTipoVeiculo }
    crossDomainAjax(surl + 'ConsultarValor', data, function (data) {

        if (!IsNullOrUndefined(data.erro))
            throw "erro";

        var tabelaHtmlTemplate = $('#tabelaResultadoPesquisa').html();

        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{mes-de-referencia}', data.MesReferencia);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{codigo-fipe}', data.CodigoFipe);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{marca}', data.Marca);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{modelo}', data.Modelo);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{ano-modelo}', data.AnoModelo);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{preco-medio}', data.Valor);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{data-consulta}', data.DataConsulta);
        tabelaHtmlTemplate = tabelaHtmlTemplate.replace('{autenticacao}', data.Autenticacao);
        $('[data-tipo=resultadoConsulta]').html(tabelaHtmlTemplate);

        // Reexibe o botão de pesquisar
        $('#' + idBotaoPesquisa).show();
    },
        function (x, t, m) {
            if (t === "timeout") {
                showModal('<p>Sistema Indisponível. Tente novamente em alguns minutos.</p>', true);
                loading(idDivResultado, "stop");
            } else {
                loading(idDivResultado, "stop");
                $('#' + idBotaoPesquisa).show(); //reexibe o botão de pesquisar
            }
        });
}


function loading(id, modo) {
    if (modo == 'stop') {
        $('#' + id).parent().children('.loader').remove();
    } else if (modo == 'start') {
        $('#' + id).parent().prepend('<div class="loader" id="loader_' + id + '"></div>');
    } else if (modo == 'start-inside') {
        $('#' + id).html('<div class="loader"></div>');
    }

}

function initAutocomplete(_id, _data, _indice) {
    $('#' + _id).html('<option value=""></option>');

    $.each(_data, function (codigo, data) {
        var tipo = 0;
        if (_id.indexOf('moto') > 0) { tipo = 2; }
        if (_id.indexOf('camin') > 0) { tipo = 3; }

        var valor = _indice == 'ano' || _indice == 'codigoano' ? converterZeroKM(data.value, tipo) : data.value;

        var html = '<option value="' + data.codigo + '">' + valor + '</option>';
        $('#' + _id).append(html);

        if (!jQuery.browser.mobile && !$('#mobile').is(':visible')) {
            $('#' + _id).trigger("chosen:updated");
        }
    });


    if (!jQuery.browser.mobile && !$('#mobile').is(':visible')) {
        $('#' + _id).trigger("chosen:updated");
    }

    //verifica a propriedade data-valor, que é o valor que deve ser carregado ao termino do load de options. 

    var valordefault = $('#' + _id).attr('data-valor');
    if (valordefault != null && valordefault != undefined) {
        $('#' + _id).val(valordefault);
        _cod[$('#' + _id).data('tipo')] = valordefault;

        if (_indice == 'codigoano') {
            //alert("codigoano:" + valordefault)
        }
        if (!jQuery.browser.mobile && !$('#mobile').is(':visible')) {
            $('#' + _id).trigger("chosen:updated");
        }
        //deixa a propriedade em branco para o próximo load. 
        $('#' + _id).attr('data-valor', '');
    }
    loading(_id, "stop");
    $(".chosen-select").attr('disabled', false).trigger("chosen:updated");
}

function converterZeroKM(valor, tipo) {

    if (valor != null && valor != undefined) {
        if (tipo != '1') { //se não for carro não imprime o combustível
            return valor.replace('32000', 'Zero KM');
        } else {
            return valor.replace('32000', 'Zero KM a');
        }
    }
    return valor;
}

function tipoVeiculo(codigo) {

    codigo = parseInt(codigo, 10);
    switch (codigo) {
        case 1:
            return "carro"; break;
        case 2:
            return "moto"; break;
        case 3:
            return "caminhao"; break;
    }

    return "";
}

function pageViewVeiculos(data, anoMes, tipoVeiculo, tipoPesquisa) {
    try {
        // sobe valores do veículo para o g.a. como pageview
        pageViewVeiculo = '/indices-e-indicadores/veiculos/{tipoveiculo}/resultado/{tipopesquisa}/{marca}/{mesreferencia}/{codigo-fipe}/{ano-modelo}/{combustivel}/{autenticacao}/{modelo}'
        pageViewVeiculo = pageViewVeiculo.replace('{marca}', slug(data.Marca));
        if (!IsNullOrUndefined(anoMes))
            pageViewVeiculo = pageViewVeiculo.replace('{mesreferencia}', converterMesInt(anoMes[0]) + '-' + anoMes[1]);
        pageViewVeiculo = pageViewVeiculo.replace('{codigo-fipe}', data.CodigoFipe != undefined ? trimValue(data.CodigoFipe) : data.CodigoFipe);
        pageViewVeiculo = pageViewVeiculo.replace('{ano-modelo}', data.AnoModelo);
        pageViewVeiculo = pageViewVeiculo.replace('{combustivel}', data.SiglaCombustivel);
        pageViewVeiculo = pageViewVeiculo.replace('{autenticacao}', data.Autenticacao);
        pageViewVeiculo = pageViewVeiculo.replace('{modelo}', slug(data.Modelo));
        pageViewVeiculo = pageViewVeiculo.replace('{tipoveiculo}', tipoVeiculo);
        pageViewVeiculo = pageViewVeiculo.replace('{tipopesquisa}', tipoPesquisa);
        pageViewVeiculo = pageViewVeiculo.replace(/\s+/g, '');

        return pageViewVeiculo.toLowerCase();
    } catch (ex) {
        return '';
    }

}

function versaoIE() {
    if (navigator.userAgent.indexOf('MSIE') != -1) {
        return parseInt(navigator.userAgent.match(/MSIE ([\d.]+)/)[1], 10);
    }
    return null;
}


tokenReCaptcha = null;
/*
http://stackoverflow.com/questions/3362474/jquery-ajax-fails-in-ie-on-cross-domain-calls
Para corrigir erros do IE8 e IE9
*/
function crossDomainAjax(url, dados, successCallback, erroCallback) {
    var IEVersion = 11;
    var validarIE = false;

    if (navigator.userAgent.indexOf('MSIE') != -1) {
        validarIE = true;
        IEVersion = parseInt(navigator.userAgent.match(/MSIE ([\d.]+)/)[1], 10);
    }

    //grecaptcha.ready(function () {
    //    grecaptcha.execute('6LchJqcUAAAAAA6f8Zx2pEa_w09-7SN881utRepB', { action: 'validacao' }).then(function (token) {
            $.ajax({
                url: url,
                cache: false,
                dataType: 'json',
                type: 'POST',
                data: dados,
                //crossDomain: true,
                //contentType: "application/json; charset=utf-8",
                timeout: _timeout,
                async: false,
                success: function (data, success) {
                    successCallback(data);
                    //grecaptcha.reset();
                },
                error: function (a, b, c) {
                    erroCallback(a, b, c);
                    //grecaptcha.reset();
                }
            });
    //    });
    //});
}


// ReCaptcha
recaptchaId = null;
onloadCallback = function () {
    grecaptcha.render("emplacementRecaptcha", {
        "sitekey": "6LchJqcUAAAAAA6f8Zx2pEa_w09-7SN881utRepB",
        "badge": "inline",
        "type": "image",
        "size": "invisible",
        "callback": carregarTabelas()
    });
};

var carregarTabelas = function (token) {
    carregarTabelaReferencia('selectTabelaReferenciacarro');
    carregarTabelaReferencia('selectTabelaReferenciamoto');
    carregarTabelaReferencia('selectTabelaReferenciacaminhao');


    carregarTabelaReferencia('selectTabelaReferenciacarroCodigoFipe');
    carregarTabelaReferencia('selectTabelaReferenciamotoCodigoFipe');
    carregarTabelaReferencia('selectTabelaReferenciacaminhaoCodigoFipe');
};