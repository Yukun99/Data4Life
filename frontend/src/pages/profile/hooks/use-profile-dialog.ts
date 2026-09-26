import { useAppDispatch } from '@/store/hooks';
import { Avatar, updateProfile, User } from '@/store/user-slice';
import { useState } from 'react';

const useProfileDialog = (user: User) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<Avatar>(user.avatar);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openDialog = () => {
    setName(user.name);
    setAvatar(user.avatar);
    setNameError('');
    setError('');
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = async () => {
    setError('');
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      await dispatch(updateProfile({ name: name.trim(), avatar })).unwrap();
      setOpen(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return { open, name, setName, avatar, setAvatar, nameError, error, saving, openDialog, close, save };
};

export default useProfileDialog;
