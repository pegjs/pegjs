"use strict";

/* eslint-env browser, jquery */

const Runner = require( "./runner.js" );
const benchmarks = require( "./benchmarks.js" );

let BRANCH = location.hash.match( /branch=([^&]*)/i );
BRANCH = BRANCH ? BRANCH[ 1 ] : "master";

$( "#run" ).click( () => {

    // Results Table Manipulation

    const resultsTable = $( "#results-table" );

    function appendResult( klass, title, url, inputSize, parseTime ) {

        const KB = 1024;
        const MS_IN_S = 1000;

        resultsTable.append( `
            <tr class='${ klass }'>
                <td class='title'>
                    ${ url !== null ? "<a href='" + url + "'>" : "" }
                    ${ title }
                    ${ url !== null ? "</a>" : "" }
                </td>
                <td class='input-size'>
                    <span class='value'>
                        ${ ( inputSize / KB ).toFixed( 2 ) }
                    </span>
                    &nbsp;<span class='unit'>kB</span>
                </td>
                <td class='parse-time'>
                    <span class='value'>
                        ${ parseTime.toFixed( 2 ) }
                    </span>
                    &nbsp;<span class='unit'>ms</span>
                </td>
                <td class='parse-speed'>
                    <span class='value'>
                        ${ ( ( inputSize / KB ) / ( parseTime / MS_IN_S ) ).toFixed( 2 ) }
                    </span>
                    &nbsp;<span class='unit'>kB/s</span>
                </td>
            </tr>
        ` );

    }

    // Main

    // Each input is parsed multiple times and the results are averaged. We
    // do this for two reasons:
    //
    //   1. To warm up the interpreter (PEG.js-generated parsers will be
    //      most likely used repeatedly, so it makes sense to measure
    //      performance after warming up).
    //
    //   2. To minimize random errors.

    const runCount = parseInt( $( "#run-count" ).val(), 10 );
    const options = {
        cache: $( "#cache" ).is( ":checked" ),
        optimize: $( "#optimize" ).val()
    };

    if ( isNaN( runCount ) || runCount <= 0 ) {

        alert( "Number of runs must be a positive integer." );

        return;

    }

    Runner.run( benchmarks, runCount, options, {

        readFile( file ) {

            return $.ajax( {
                type: "GET",
                url: `https://raw.githubusercontent.com/pegjs/pegjs/${ BRANCH }/` + file,
                dataType: "text",
                async: false
            } ).responseText;

        },

        testStart() {
            // Nothing to do.
        },

        testFinish( benchmark, test, inputSize, parseTime ) {

            appendResult(
                "individual",
                test.title,
                `https://github.com/pegjs/pegjs/blob/${ BRANCH }/tools/benchmark/${ benchmark.id }/${ test.file }`,
                inputSize,
                parseTime
            );

        },

        benchmarkStart( benchmark ) {

            resultsTable.append( `
                <tr class='heading'>
                    <th colspan='4'>
                        <a href='https://github.com/pegjs/pegjs/blob/${ BRANCH }/examples/${ benchmark.id }.pegjs'> ${ benchmark.title } </a>
                    </th>
                </tr>"
            ` );

        },

        benchmarkFinish( benchmark, inputSize, parseTime ) {

            appendResult(
                "benchmark-total",
                benchmark.title + " total",
                null,
                inputSize,
                parseTime
            );

        },

        start() {

            $( "#run-count, #cache, #run" ).attr( "disabled", "disabled" );

            resultsTable.show();
            $( "#results-table tr" ).slice( 1 ).remove();

        },

        finish( inputSize, parseTime ) {

            appendResult(
                "total",
                "Total",
                null,
                inputSize,
                parseTime
            );

            $.scrollTo( "max", { axis: "y", duration: 500 } );
            $( "#run-count, #cache, #run" ).removeAttr( "disabled" );

        }

    } );

} );

$( document ).ready( () => $( "#run" ).focus() );
