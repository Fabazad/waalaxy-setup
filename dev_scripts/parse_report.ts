import { parseArgs } from './parse_report/parseArgs';
import { isValidReport } from './parse_report/isValidReport';

/**
 *
 * syntaxe
 * ts-node parse_report/ -- --file ./test_report.json
 */

let unknownReport = parseArgs(process.argv);

if (!isValidReport(unknownReport)) {
    throw new TypeError('Submitted report seems to be invalid');
}

const { report, status: reportStatus } = unknownReport;

const parsed = report.reduce<{
    pagesScanned: number;
    prospectsCounts: number;
    averageScannedPerPage: number;
    successCount: number;
    errorCount: number;
    errorsReasons: Record<string, number>;
}>(
    ({ prospectsCounts, averageScannedPerPage, errorsReasons, errorCount, successCount, pagesScanned }, { prospects }, index) => {
        let perPageAverage = averageScannedPerPage + prospects.length;

        if (index === report.length - 1) {
            perPageAverage /= report.length || 1;
        }

        let success = 0;
        let errors = 0;

        prospects.forEach((prospect) => {
            if (prospect.status === 'error') {
                errors += 1;
            } else {
                success += 1;
            }
            if (prospect.status === 'error' && prospect.reason) {
                if (prospect.reason in errorsReasons) {
                    errorsReasons[prospect.reason] += 1;
                } else errorsReasons[prospect.reason] = 1;
            }
        });

        return {
            pagesScanned: pagesScanned + 1,
            successCount: successCount + success,
            errorCount: errorCount + errors,
            errorsReasons,
            prospectsCounts: prospectsCounts + prospects.length,
            averageScannedPerPage: perPageAverage,
        };
    },
    {
        pagesScanned: 0,
        successCount: 0,
        errorCount: 0,
        errorsReasons: {},
        prospectsCounts: 0,
        averageScannedPerPage: 0,
    },
);

console.log('reportStatus', reportStatus);
console.log('reportData', parsed);
