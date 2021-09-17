import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as ROA from "fp-ts/ReadonlyArray";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { SupabaseQueryBuilder } from "@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder";
import { pipe } from "fp-ts/lib/function";
import { map } from "fp-ts/lib/Array";
import { Errors, Mixed, TypeOf } from "io-ts";
import { PostgrestError } from "@supabase/postgrest-js/src/lib/types";
import SupabaseClient from "@supabase/supabase-js/dist/main/SupabaseClient";

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
    ): TE.TaskEither<ErrorType, readonly ReturnType[]> =>
    async (): Promise<E.Either<ErrorType, readonly ReturnType[]>> =>
      pipe(
        await query,
        ({ error, data }): E.Either<ErrorType, readonly ReturnType[]> =>
          error !== null
            ? E.left(onRequestError(error))
            : data === null
            ? E.left(onNoDataError())
            : pipe(
                E.sequenceArray(pipe(data, map(validation.decode))),
                E.mapLeft(onValidationError)
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
) => TE.TaskEither<ErrorType, readonly TypeOf<ValidationType>[]>) => {
  type ReturnType = TypeOf<typeof validation>;
  return <SupabaseTable extends string, ErrorType = unknown>(
      table: SupabaseTable,
      execute: (
        query: SupabaseQueryBuilder<ReturnType>
      ) => PostgrestFilterBuilder<ReturnType>,
      onError: OnErrorRequest<ErrorType>
    ) =>
    (source: SupabaseClient): TE.TaskEither<ErrorType, readonly ReturnType[]> =>
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
) => TE.TaskEither<ErrorType, TypeOf<ValidationType>>) => {
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
    (source: SupabaseClient): TE.TaskEither<ErrorType, ReturnType> =>
      pipe(
        _supabaseRequestWithValidation<ReturnType>(validation)<ErrorType>(
          execute(source.from<ReturnType>(table)).limit(1),
          onError
        ),
        TE.chain((dataList) =>
          pipe(
            dataList,
            ROA.head,
            O.fold(
              (): TE.TaskEither<ErrorType, ReturnType> => TE.left(onZeroData()),
              (data) => TE.of(data)
            )
          )
        )
      );
};
