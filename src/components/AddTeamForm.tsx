import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';

interface AddTeamFormProps {
  open: boolean;
  onClose: () => void;
}

const AddTeamForm: React.FC<AddTeamFormProps> = ({ open, onClose }) => {
  const [teamData, setTeamData] = useState({
    teamName: '',
    schoolName: '',
    teamNumber: '',
    student1: '',
    student2: '',
    category: 'jr' as 'jr' | 'sr',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<'jr' | 'sr'>) => {
    setTeamData(prev => ({
      ...prev,
      category: e.target.value as 'jr' | 'sr'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const teamsRef = ref(database, 'teams');
      await push(teamsRef, {
        ...teamData,
        status: 'registered',
        checkInTime: null,
        scores: null,
        createdAt: new Date().toISOString(),
      });
      
      setSuccess(true);
      setTeamData({
        teamName: '',
        schoolName: '',
        teamNumber: '',
        student1: '',
        student2: '',
        category: 'jr',
      });
      
      // Close the form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to add team. Please try again.');
      console.error('Error adding team:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Team</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Team added successfully!</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              label="Team Name"
              name="teamName"
              value={teamData.teamName}
              onChange={handleTextChange}
              fullWidth
            />
            <TextField
              required
              label="School Name"
              name="schoolName"
              value={teamData.schoolName}
              onChange={handleTextChange}
              fullWidth
            />
            <TextField
              required
              label="Team Number"
              name="teamNumber"
              value={teamData.teamNumber}
              onChange={handleTextChange}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={teamData.category}
                onChange={handleSelectChange}
                label="Category"
              >
                <MenuItem value="jr">Junior</MenuItem>
                <MenuItem value="sr">Senior</MenuItem>
              </Select>
            </FormControl>
            <TextField
              required
              label="Student 1 Name"
              name="student1"
              value={teamData.student1}
              onChange={handleTextChange}
              fullWidth
            />
            <TextField
              required
              label="Student 2 Name"
              name="student2"
              value={teamData.student2}
              onChange={handleTextChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add Team
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddTeamForm; 