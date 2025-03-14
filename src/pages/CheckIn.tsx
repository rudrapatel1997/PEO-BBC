import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase';
import { Team } from '../types';

interface TeamData {
  teamNumber: string;
  teamName: string;
  schoolName: string;
  student1: string;
  student2: string;
  category: 'jr' | 'sr';
  status: 'registered' | 'waiting' | 'checked-in' | 'completed';
  createdAt: string;
  arrivalTime?: string;
  checkInTime?: string;
}

const CheckIn: React.FC = () => {
  const [teamNumber, setTeamNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsRef = ref(database, 'teams');
        const snapshot = await get(teamsRef);
        if (snapshot.exists()) {
          const teamsData = snapshot.val();
          const teamsArray = Object.entries(teamsData).map(([id, teamData]: [string, any]) => {
            // Ensure all required fields are present with defaults
            const team: Team = {
              id,
              teamNumber: teamData.teamNumber || '',
              teamName: teamData.teamName || '',
              schoolName: teamData.schoolName || '',
              student1: teamData.student1 || '',
              student2: teamData.student2 || '',
              category: teamData.category || 'jr',
              status: teamData.status || 'registered',
              createdAt: teamData.createdAt || new Date().toISOString(),
              arrivalTime: teamData.arrivalTime,
              checkInTime: teamData.checkInTime
            };
            return team;
          });
          setTeams(teamsArray);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleStatusUpdate = async (status: 'checked-in' | 'waiting') => {
    try {
      setError('');
      setSuccess('');
      
      // Find team by team number
      const teamsRef = ref(database, 'teams');
      const snapshot = await get(teamsRef);
      
      if (!snapshot.exists()) {
        setError('Team not found');
        return;
      }

      const teamsData = snapshot.val() as Record<string, TeamData>;
      const teamEntry = Object.entries(teamsData).find(([_, data]) => 
        data.teamNumber === teamNumber
      );

      if (!teamEntry) {
        setError('Team not found');
        return;
      }

      const [teamId, data] = teamEntry;
      const team: Team = {
        id: teamId,
        teamNumber: data.teamNumber || '',
        teamName: data.teamName || '',
        schoolName: data.schoolName || '',
        student1: data.student1 || '',
        student2: data.student2 || '',
        category: data.category || 'jr',
        status: data.status || 'registered' as const,
        createdAt: data.createdAt || new Date().toISOString(),
        arrivalTime: data.arrivalTime,
        checkInTime: data.checkInTime
      };

      // Status transition rules
      if (team.status === 'checked-in') {
        setError('Team is already checked in and cannot change status');
        return;
      }

      if (team.status === 'waiting' && status === 'waiting') {
        setError('Team is already in waiting area');
        return;
      }

      if (team.status === 'completed') {
        setError('Team has completed their competition and cannot change status');
        return;
      }

      const currentTime = new Date().toISOString();
      
      // Only check arrival time if it exists and trying to check in
      if (status === 'checked-in' && team.arrivalTime) {
        const arrivalTime = new Date(team.arrivalTime).getTime();
        const currentTimeMs = new Date().getTime();

        if (currentTimeMs < arrivalTime) {
          setError('Team is early. Please send them to the waiting area.');
          return;
        }
      }

      // Update team status
      const teamRef = ref(database, `teams/${teamId}`);
      await update(teamRef, {
        status: status,
        ...(status === 'checked-in' ? { checkInTime: currentTime } : {}),
      });

      setSuccess(status === 'checked-in' ? 'Team checked in successfully!' : 'Team sent to waiting area!');
      setTeamNumber('');
      
      // Update local state
      setTeams(teams.map(t => 
        t.teamNumber === teamNumber
          ? { ...t, status: status, ...(status === 'checked-in' ? { checkInTime: currentTime } : {}) }
          : t
      ));
    } catch (err) {
      console.error('Error updating team status:', err);
      setError('Failed to update team status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'warning';
      case 'checked-in':
        return 'success';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  // Function to determine which buttons should be enabled based on current status
  const getAvailableActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'registered':
        return { canCheckIn: true, canWait: true };
      case 'waiting':
        return { canCheckIn: true, canWait: false };
      case 'checked-in':
      case 'completed':
        return { canCheckIn: false, canWait: false };
      default:
        return { canCheckIn: true, canWait: true };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Check In Teams
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Team Number"
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleStatusUpdate('checked-in')}
              disabled={!teamNumber || (teams.find(t => t.teamNumber === teamNumber)?.status === 'checked-in')}
              fullWidth
              color="primary"
            >
              Check In
            </Button>
            <Button
              variant="contained"
              onClick={() => handleStatusUpdate('waiting')}
              disabled={!teamNumber || 
                ['checked-in', 'waiting', 'completed'].includes(teams.find(t => t.teamNumber === teamNumber)?.status || '')}
              fullWidth
              color="warning"
            >
              Send to Waiting Area
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Number</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>Student 1</TableCell>
                <TableCell>Student 2</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Arrival Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => {
                const { canCheckIn, canWait } = getAvailableActions(team.status);
                return (
                  <TableRow 
                    key={team.teamNumber}
                    sx={team.status === 'waiting' ? { backgroundColor: 'rgba(255, 152, 0, 0.1)' } : undefined}
                  >
                    <TableCell>{team.teamNumber}</TableCell>
                    <TableCell>{team.teamName}</TableCell>
                    <TableCell>{team.student1}</TableCell>
                    <TableCell>{team.student2}</TableCell>
                    <TableCell>{team.category ? team.category.toUpperCase() : 'N/A'}</TableCell>
                    <TableCell>
                      {team.arrivalTime ? new Date(team.arrivalTime).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={team.status || 'registered'}
                        color={getStatusColor(team.status || 'registered')}
                      />
                    </TableCell>
                    <TableCell>
                      {team.checkInTime
                        ? new Date(team.checkInTime).toLocaleTimeString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {canCheckIn && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setTeamNumber(team.teamNumber);
                              handleStatusUpdate('checked-in');
                            }}
                          >
                            Check In
                          </Button>
                        )}
                        {canWait && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => {
                              setTeamNumber(team.teamNumber);
                              handleStatusUpdate('waiting');
                            }}
                          >
                            Wait
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default CheckIn; 