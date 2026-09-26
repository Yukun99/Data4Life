import { useAppDispatch } from '@/store/hooks';
import { Avatar, deleteAccount, updateProfile, User } from '@/store/user-slice';
import { useState } from 'react';

const useProfileDialog = (user: User) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState<Avatar>(user.avatar);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDialog = () => {
    setName(user.name);
    setAvatar(user.avatar);
    setNameError('');
    setError('');
    setConfirmingDelete(false);
    setDeleteError('');
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

  const startDelete = () => {
    setDeleteError('');
    setConfirmingDelete(true);
  };

  const cancelDelete = () => setConfirmingDelete(false);

  const confirmDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await dispatch(deleteAccount()).unwrap();
    } catch (err) {
      setDeleteError(String(err));
    } finally {
      setDeleting(false);
    }
  };

  return {
    open,
    name,
    setName,
    avatar,
    setAvatar,
    nameError,
    error,
    saving,
    openDialog,
    close,
    save,
    confirmingDelete,
    deleteError,
    deleting,
    startDelete,
    cancelDelete,
    confirmDelete,
  };
};

export default useProfileDialog;
