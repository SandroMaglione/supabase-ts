import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { PostgrestError } from '@supabase/postgrest-js/src/lib/types';
import { SupabaseQueryBuilder } from '@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder';
import SupabaseClient from '@supabase/supabase-js/dist/main/SupabaseClient';
import * as E from 'fp-ts/Either';
import { map } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as ROA from 'fp-ts/ReadonlyArray';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';

/** All possible errors when peforming a request using `requestListWithValidation` from `supabase-ts`. */
export type OnErrorListRequest<ErrorType = unknown> = {
  onNoDataError: () => ErrorType;
  onRequestError: (error: PostgrestError) => ErrorType;
  onValidationError: (errors: t.Errors) => ErrorType;
};

/** All possible errors when peforming a request using `requestSingleWithValidation` from `supabase-ts`. */
export type OnErrorSingleRequest<ErrorType = unknown> =
  OnErrorListRequest<ErrorType> & {
    onZeroData: () => ErrorType;
  };

/** Table schema validation when making a request using `supabase-ts`. */
export type TableValidated<
  SupabaseTable extends string,
  TableSchema extends t.Props
> = {
  name: SupabaseTable;
  schema: t.TypeC<TableSchema>;
};

class SupabaseClientIO<
  SupabaseTable extends string,
  ClientErrorType = unknown
> {
  supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  protected requestWithValidation = <TableSchema extends t.Props>(
    tableValidated: TableValidated<SupabaseTable, TableSchema>
  ) => {
    // Extract schema validation type
    const schema = tableValidated.schema;
    type TableType = t.TypeOf<typeof schema>;

    return <ErrorType = ClientErrorType>(
        query: PostgrestFilterBuilder<TableType>,
        {
          onNoDataError,
          onRequestError,
          onValidationError,
        }: OnErrorListRequest<ErrorType>
      ): TE.TaskEither<ErrorType, readonly TableType[]> =>
      async (): Promise<E.Either<ErrorType, readonly TableType[]>> =>
        pipe(
          await query,
          ({ error, data }): E.Either<ErrorType, readonly TableType[]> =>
            error !== null
              ? E.left(onRequestError(error))
              : data === null
              ? E.left(onNoDataError())
              : pipe(
                  E.sequenceArray(pipe(data, map(schema.decode))),
                  E.mapLeft(onValidationError)
                )
        );
  };

  /**
   * Perform a request to supabase and return a list of values.
   *
   * @param tableValidated name of the table and [`io-ts`](https://github.com/gcanti/io-ts) validated schema
   * @returns Either the result of the request to supabase or a user-defined error (no exception!)
   */
  requestListWithValidation = <TableSchema extends t.Props>(
    tableValidated: TableValidated<SupabaseTable, TableSchema>
  ) => {
    // Extract schema validation type
    const schema = tableValidated.schema;
    const table = tableValidated.name;
    type TableType = t.TypeOf<typeof schema>;

    return <ErrorType = ClientErrorType>(
      execute: (
        query: SupabaseQueryBuilder<TableType>
      ) => PostgrestFilterBuilder<TableType>,
      onError: OnErrorListRequest<ErrorType>
    ): TE.TaskEither<ErrorType, readonly TableType[]> =>
      this.requestWithValidation<TableSchema>(tableValidated)<ErrorType>(
        execute(this.supabaseClient.from<TableType>(table)),
        onError
      );
  };

  /**
   * Perform a request to supabase and return a single value.
   *
   * @param tableValidated name of the table and [`io-ts`](https://github.com/gcanti/io-ts) validated schema
   * @returns Either the result of the request to supabase or a user-defined error (no exception!)
   */
  requestSingleWithValidation = <TableSchema extends t.Props>(
    tableValidated: TableValidated<SupabaseTable, TableSchema>
  ) => {
    // Extract schema validation type
    const schema = tableValidated.schema;
    const table = tableValidated.name;
    type TableType = t.TypeOf<typeof schema>;

    return <ErrorType = ClientErrorType>(
      execute: (
        query: SupabaseQueryBuilder<TableType>
      ) => PostgrestFilterBuilder<TableType>,
      { onZeroData, ...onError }: OnErrorSingleRequest<ErrorType>
    ): TE.TaskEither<ErrorType, TableType> =>
      pipe(
        this.requestWithValidation<TableSchema>(tableValidated)<ErrorType>(
          execute(this.supabaseClient.from<TableType>(table)).limit(1),
          onError
        ),
        TE.chain((dataList) =>
          pipe(
            dataList,
            ROA.head,
            O.fold(
              (): TE.TaskEither<ErrorType, TableType> => TE.left(onZeroData()),
              TE.of
            )
          )
        )
      );
  };
}

/**
 * Builds an instance of `SupabaseClientIO` from a `SupabaseClient`.
 *
 * - `SupabaseTable`: specify tables/views names allowed
 * - `ClientErrorType`: default error type
 *
 * @param supabaseClient Reference to a `SupabaseClient`
 * @returns Instance of `SupabaseClientIO` used to perform validated requests
 */
export const createClientIO = <
  SupabaseTable extends string,
  ClientErrorType = unknown
>(
  supabaseClient: SupabaseClient
) => {
  return new SupabaseClientIO<SupabaseTable, ClientErrorType>(supabaseClient);
};
