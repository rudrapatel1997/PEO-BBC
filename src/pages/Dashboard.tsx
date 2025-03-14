import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import { ref, get, query, orderByChild, onValue, remove } from 'firebase/database';
import { database } from '../firebase';
import { Team, TeamScore } from '../types';
import * as XLSX from 'xlsx';
import AddTeamForm from '../components/AddTeamForm';

const Dashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams
        const teamsRef = ref(database, 'teams');
        const teamsSnapshot = await get(teamsRef);
        if (teamsSnapshot.exists()) {
          const teamsData = teamsSnapshot.val();
          const teamsArray = Object.entries(teamsData).map(([id, team]: [string, any]) => ({
            ...team,
            id,
          }));
          setTeams(teamsArray);
        }

        // Fetch team scores
        const scoresRef = ref(database, 'teamScores');
        const scoresSnapshot = await get(scoresRef);
        if (scoresSnapshot.exists()) {
          const scoresData = scoresSnapshot.val();
          const scoresArray = Object.values(scoresData) as TeamScore[];
          setTeamScores(scoresArray);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribe = onValue(ref(database, 'teams'), (snapshot) => {
      const teamsData = snapshot.val();
      if (teamsData) {
        const teamsArray = Object.entries(teamsData).map(([id, team]: [string, any]) => ({
          id,
          ...team,
        }));
        setTeams(teamsArray);
      } else {
        setTeams([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteTeam = async (teamId: string | undefined) => {
    if (!teamId) {
      console.error('No team ID provided');
      return;
    }

    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        const teamRef = ref(database, `teams/${teamId}`);
        await remove(teamRef);
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
      }
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

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = teams.map(team => {
      const teamScore = teamScores.find(score => score.teamNumber === team.teamNumber);
      return {
        'Team Number': team.teamNumber,
        'Team Name': team.teamName,
        'Category': team.category ? team.category.toUpperCase() : 'N/A',
        'School': team.schoolName,
        'Status': team.status || 'registered',
        'Arrival Time': team.arrivalTime ? new Date(team.arrivalTime).toLocaleTimeString() : '-',
        'Check-in Time': team.checkInTime ? new Date(team.checkInTime).toLocaleTimeString() : '-',
        'Total Score': teamScore?.totalScore || '-',
        'Rank': teamScore?.rank || '-',
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Competition Results');

    // Save file
    XLSX.writeFile(wb, 'bridge-building-competition-results.xlsx');
  };

  const stats = {
    totalTeams: teams.length,
    juniorTeams: teams.filter(team => team.category === 'jr').length,
    seniorTeams: teams.filter(team => team.category === 'sr').length,
    waitingTeams: teams.filter(team => team.status === 'waiting').length,
    checkedInTeams: teams.filter(team => team.status === 'checked-in').length,
    completedTeams: teams.filter(team => team.status === 'completed').length,
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddTeamOpen(true)}
        >
          Add New Team
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Competition Dashboard
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={exportToExcel}
          >
            Export to Excel
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Total Teams</Typography>
              <Typography variant="h4">{stats.totalTeams}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Junior Teams</Typography>
              <Typography variant="h4">{stats.juniorTeams}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Senior Teams</Typography>
              <Typography variant="h4">{stats.seniorTeams}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Waiting</Typography>
              <Typography variant="h4">{stats.waitingTeams}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Checked In</Typography>
              <Typography variant="h4">{stats.checkedInTeams}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Completed</Typography>
              <Typography variant="h4">{stats.completedTeams}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom>
          Team Status
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Number</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>Student 1</TableCell>
                <TableCell>Student 2</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Arrival Time</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Total Score</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => {
                const teamScore = teamScores.find(score => score.teamNumber === team.teamNumber);
                return (
                  <TableRow key={team.id}>
                    <TableCell>{team.teamNumber}</TableCell>
                    <TableCell>{team.teamName}</TableCell>
                    <TableCell>{team.student1}</TableCell>
                    <TableCell>{team.student2}</TableCell>
                    <TableCell>{team.category ? team.category.toUpperCase() : 'N/A'}</TableCell>
                    <TableCell>{team.schoolName}</TableCell>
                    <TableCell>
                      <Chip
                        label={team.status || 'registered'}
                        color={getStatusColor(team.status || 'registered')}
                      />
                    </TableCell>
                    <TableCell>
                      {team.arrivalTime ? new Date(team.arrivalTime).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>
                      {team.checkInTime ? new Date(team.checkInTime).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell>{teamScore?.totalScore || '-'}</TableCell>
                    <TableCell>{teamScore?.rank || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AddTeamForm
        open={isAddTeamOpen}
        onClose={() => setIsAddTeamOpen(false)}
      />
    </Container>
  );
};

export default Dashboard; 