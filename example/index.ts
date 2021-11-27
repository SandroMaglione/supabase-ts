import { SupabaseClient } from '@supabase/supabase-js';
import * as TE from 'fp-ts/TaskEither';
import * as t from 'io-ts';
import createClientIO from '../src/main';

// How to use 👇

const supabaseClient: SupabaseClient = '' as unknown as SupabaseClient;
const supabaseClientIO = createClientIO<number>(supabaseClient);

const schema = t.type({ name: t.string });
type Schema = t.TypeOf<typeof schema>;
const tableValidated = {
  name: 'table1',
  schema,
};

const responseList: TE.TaskEither<string, readonly Schema[]> =
  supabaseClientIO.requestListWithValidation(tableValidated)(
    (query) => query.select(),
    {
      onNoDataError: () => '',
      onRequestError: () => '',
      onValidationError: () => '',
    }
  );

const responseSingle: TE.TaskEither<string, Schema> =
  supabaseClientIO.requestSingleWithValidation(tableValidated)(
    (query) => query.select(),
    {
      onZeroData: () => '',
      onNoDataError: () => '',
      onRequestError: () => '',
      onValidationError: () => '',
    }
  );
