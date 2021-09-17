import { fold } from "fp-ts/Option";
import { TaskEither, left as TEleft, of, chain } from "fp-ts/TaskEither";
import { Either, left as Eleft, sequenceArray, mapLeft } from "fp-ts/Either";
import { head as ROAhead } from "fp-ts/ReadonlyArray";
import SupabaseClient from "@supabase/supabase-js/dist/main/SupabaseClient";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder";
import { pipe } from "fp-ts/lib/function";
import { map } from "fp-ts/lib/Array";
import { Errors, Mixed, TypeOf } from "io-ts";
import { PostgrestError } from "@supabase/postgrest-js/src/lib/types";

interface OnErrorRequest<ErrorType> {
  onNoDataError: () => ErrorType;
  onRequestError: (error: PostgrestError) => ErrorType;
  onValidationError: (errors: Errors) => ErrorType;
}

const _supabaseRequestWithValidation = <ValidationType extends Mixed>(
  validation: ValidationType
) => {
  type ReturnType = TypeOf<typeof validation>;
  return <ErrorType = unknown>(
      query: PostgrestFilterBuilder<ReturnType>,
      {
        onNoDataError,
        onRequestError,
        onValidationError,
      }: OnErrorRequest<ErrorType>
    ): TaskEither<ErrorType, readonly ReturnType[]> =>
    async (): Promise<Either<ErrorType, readonly ReturnType[]>> =>
      pipe(
        await query,
        ({ error, data }): Either<ErrorType, readonly ReturnType[]> =>
          error !== null
            ? Eleft(onRequestError(error))
            : data === null
            ? Eleft(onNoDataError())
            : pipe(
                sequenceArray(pipe(data, map(validation.decode))),
                mapLeft(onValidationError)
              )
      );
};

export const supabaseRequestListWithValidation = <ValidationType extends Mixed>(
  validation: ValidationType
): (<SupabaseTable extends string, ErrorType = unknown>(
  table: SupabaseTable,
  execute: (
    query: SupabaseQueryBuilder<TypeOf<ValidationType>>
  ) => PostgrestFilterBuilder<TypeOf<ValidationType>>,
  onError: OnErrorRequest<ErrorType>
) => (
  source: SupabaseClient
) => TaskEither<ErrorType, readonly TypeOf<ValidationType>[]>) => {
  type ReturnType = TypeOf<typeof validation>;
  return <SupabaseTable extends string, ErrorType = unknown>(
      table: SupabaseTable,
      execute: (
        query: SupabaseQueryBuilder<ReturnType>
      ) => PostgrestFilterBuilder<ReturnType>,
      onError: OnErrorRequest<ErrorType>
    ) =>
    (source: SupabaseClient): TaskEither<ErrorType, readonly ReturnType[]> =>
      _supabaseRequestWithValidation<ReturnType>(validation)<ErrorType>(
        execute(source.from<ReturnType>(table)),
        onError
      );
};

export const supabaseRequestSingleWithValidation = <
  ValidationType extends Mixed
>(
  validation: ValidationType
): (<SupabaseTable extends string, ErrorType = unknown>(
  table: SupabaseTable,
  execute: (
    query: SupabaseQueryBuilder<TypeOf<ValidationType>>
  ) => PostgrestFilterBuilder<TypeOf<ValidationType>>,
  {
    onZeroData,
    ...onError
  }: OnErrorRequest<ErrorType> & { onZeroData: () => ErrorType }
) => (
  source: SupabaseClient
) => TaskEither<ErrorType, TypeOf<ValidationType>>) => {
  type ReturnType = TypeOf<typeof validation>;
  return <SupabaseTable extends string, ErrorType = unknown>(
      table: SupabaseTable,
      execute: (
        query: SupabaseQueryBuilder<ReturnType>
      ) => PostgrestFilterBuilder<ReturnType>,
      {
        onZeroData,
        ...onError
      }: OnErrorRequest<ErrorType> & {
        onZeroData: () => ErrorType;
      }
    ) =>
    (source: SupabaseClient): TaskEither<ErrorType, ReturnType> =>
      pipe(
        _supabaseRequestWithValidation<ReturnType>(validation)<ErrorType>(
          execute(source.from<ReturnType>(table)).limit(1),
          onError
        ),
        chain((dataList) =>
          pipe(
            dataList,
            ROAhead,
            fold(
              (): TaskEither<ErrorType, ReturnType> => TEleft(onZeroData()),
              (data) => of(data)
            )
          )
        )
      );
};
