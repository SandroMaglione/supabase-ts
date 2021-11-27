import { __awaiter, __generator, __rest } from "tslib";
import * as E from 'fp-ts/Either';
import { map } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as ROA from 'fp-ts/ReadonlyArray';
import * as TE from 'fp-ts/TaskEither';
var SupabaseClientIO = /** @class */ (function () {
    function SupabaseClientIO(supabaseClient) {
        var _this = this;
        this.requestWithValidation = function (tableValidated) {
            // Extract schema validation type
            var schema = tableValidated.schema;
            return function (query, _a) {
                var onNoDataError = _a.onNoDataError, onRequestError = _a.onRequestError, onValidationError = _a.onValidationError;
                return function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = pipe;
                                return [4 /*yield*/, query];
                            case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), function (_a) {
                                        var error = _a.error, data = _a.data;
                                        return error !== null
                                            ? E.left(onRequestError(error))
                                            : data === null
                                                ? E.left(onNoDataError())
                                                : pipe(E.sequenceArray(pipe(data, map(schema.decode))), E.mapLeft(onValidationError));
                                    }])];
                        }
                    });
                }); };
            };
        };
        /**
         * Perform a request to supabase and return a list of values.
         *
         * @param tableValidated name of the table and [`io-ts`](https://github.com/gcanti/io-ts) validated schema
         * @returns Either the result of the request to supabase or a user-defined error (no exception!)
         */
        this.requestListWithValidation = function (tableValidated) {
            // Extract schema validation type
            var schema = tableValidated.schema;
            var table = tableValidated.name;
            return function (execute, onError) {
                return _this.requestWithValidation(tableValidated)(execute(_this.supabaseClient.from(table)), onError);
            };
        };
        /**
         * Perform a request to supabase and return a single value.
         *
         * @param tableValidated name of the table and [`io-ts`](https://github.com/gcanti/io-ts) validated schema
         * @returns Either the result of the request to supabase or a user-defined error (no exception!)
         */
        this.requestSingleWithValidation = function (tableValidated) {
            // Extract schema validation type
            var schema = tableValidated.schema;
            var table = tableValidated.name;
            return function (execute, _a) {
                var onZeroData = _a.onZeroData, onError = __rest(_a, ["onZeroData"]);
                return pipe(_this.requestWithValidation(tableValidated)(execute(_this.supabaseClient.from(table)).limit(1), onError), TE.chain(function (dataList) {
                    return pipe(dataList, ROA.head, O.fold(function () { return TE.left(onZeroData()); }, TE.of));
                }));
            };
        };
        this.supabaseClient = supabaseClient;
    }
    return SupabaseClientIO;
}());
/**
 * Builds an instance of `SupabaseClientIO` from a `SupabaseClient`.
 *
 * - `SupabaseTable`: specify tables/views names allowed
 * - `ClientErrorType`: default error type
 *
 * @param supabaseClient Reference to a `SupabaseClient`
 * @returns Instance of `SupabaseClientIO` used to perform validated requests
 */
export var createClientIO = function (supabaseClient) {
    return new SupabaseClientIO(supabaseClient);
};
//# sourceMappingURL=main.js.map