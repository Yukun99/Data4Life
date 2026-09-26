import { NamedItem } from '@/common/types';
import { apiFetch, errorMessage } from '@/common/utils/api';
import { useEffect, useState } from 'react';

export type { NamedItem };

export type InterestOptions = {
  genres: NamedItem[];
  languages: NamedItem[];
};

type Interests = InterestOptions & { prompted: boolean };

export const MAX_INTERESTS = 10;

const useInterests = () => {
  const [options, setOptions] = useState<InterestOptions>({ genres: [], languages: [] });
  const [interests, setInterests] = useState<Interests | null>(null);
  const [open, setOpen] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [genres, setGenres] = useState<NamedItem[]>([]);
  const [languages, setLanguages] = useState<NamedItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<InterestOptions>('/api/interests/options'),
      apiFetch<Interests>('/api/interests'),
    ])
      .then(([loadedOptions, loaded]) => {
        if (!active) {
          return;
        }
        setOptions(loadedOptions);
        setInterests(loaded);
        if (!loaded.prompted) {
          setFirstTime(true);
          setOpen(true);
        }
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  const edit = () => {
    setGenres(interests?.genres ?? []);
    setLanguages(interests?.languages ?? []);
    setFirstTime(false);
    setError('');
    setOpen(true);
  };

  const submit = async (path: string, init: RequestInit) => {
    setError('');
    setSaving(true);
    try {
      const saved = await apiFetch<Interests | undefined>(path, init);
      setInterests((current) => saved ?? { genres: [], languages: [], ...current, prompted: true });
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const skip = () => submit('/api/interests/skip', { method: 'POST' });

  const confirm = () =>
    submit('/api/interests', {
      method: 'PUT',
      body: JSON.stringify({
        genreIds: genres.map(({ id }) => id),
        languageIds: languages.map(({ id }) => id),
      }),
    });

  const close = () => (firstTime ? skip() : setOpen(false));

  return {
    options,
    interests,
    open,
    firstTime,
    genres,
    setGenres,
    languages,
    setLanguages,
    total: genres.length + languages.length,
    error,
    saving,
    edit,
    skip,
    confirm,
    close,
  };
};

export default useInterests;
