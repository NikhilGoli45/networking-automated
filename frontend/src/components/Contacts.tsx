import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CenterWrapper from '../components/layout/CenterWrapper';

interface Contact {
  id: string;
  name: string;
  email: string;
  original_email: string;
  created_at: string;
  status: string;
  followup_count: number;
}

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    original_email: '',
  });
  const [error, setError] = useState<{ message: string; severity: 'error' | 'success' } | null>(null);
  const { logout, token } = useAuth();

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchContacts();
    }
  }, [token]);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/api/contacts');
      setContacts(response.data);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setError({
        message: error.response?.data?.error || 'Failed to fetch contacts',
        severity: 'error'
      });
    }
  };

  const handleAddContact = async () => {
    try {
      await api.post('/api/contacts', newContact);
      setOpen(false);
      setNewContact({ name: '', email: '', original_email: '' });
      fetchContacts();
      setError({
        message: 'Contact added successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error adding contact:', error);
      setError({
        message: error.response?.data?.error || 'Failed to add contact',
        severity: 'error'
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await api.delete(`/api/contacts/${id}`);
      fetchContacts();
      setError({
        message: 'Contact deleted successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      setError({
        message: error.response?.data?.error || 'Failed to delete contact',
        severity: 'error'
      });
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleRunScheduler = async () => {
    try {
      await api.post('/run-scheduler');
      setError({
        message: 'Scheduler completed successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error running scheduler:', error);
      setError({
        message: error.response?.data?.error || 'Failed to run scheduler',
        severity: 'error'
      });
    }
  };

  return (
    <CenterWrapper>
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h2">
            Contacts
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ ml: 2 }}
          >
            Add Contact
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRunScheduler}
            sx={{ ml: 2 }}
          >
            Run Scheduler
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={logout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Original Email</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Follow‑ups</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.original_email}</TableCell>
                  <TableCell>
                    {new Date(contact.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{contact.status}</TableCell>
                  <TableCell>{contact.followup_count}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity={error?.severity} sx={{ width: '100%' }}>
            {error?.message}
          </Alert>
        </Snackbar>

        {/* Add Contact Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={newContact.name}
              onChange={(e) =>
                setNewContact({ ...newContact, name: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={newContact.email}
              onChange={(e) =>
                setNewContact({ ...newContact, email: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Original Email"
              type="text"
              fullWidth
              value={newContact.original_email}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  original_email: e.target.value,
                })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContact} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </CenterWrapper>
  );
};

export default Contacts;
