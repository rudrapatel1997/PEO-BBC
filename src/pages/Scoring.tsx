import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Slider,
  Grid,
} from '@mui/material';
import { ref, get, push, set } from 'firebase/database';
import { database } from '../firebase';
import { Team, JudgeScore } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Scoring: React.FC = () => {
  const [teamNumber, setTeamNumber] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState({
    criteria1: 5,
    criteria2: 5,
    criteria3: 5,
    criteria4: 5,
    criteria5: 5,
  });
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const handleTeamSearch = async () => {
    try {
      setError('');
      setSuccess('');
      setTeam(null);

      // Find team by team number
      const teamsRef = ref(database, 'teams');
      const snapshot = await get(teamsRef);

      if (!snapshot.exists()) {
        setError('Team not found');
        return;
      }

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

      const teamsData = snapshot.val() as Record<string, TeamData>;
      const teamEntry = Object.entries(teamsData).find(([_, data]: [string, TeamData]) => 
        data.teamNumber === teamNumber
      );

      if (!teamEntry) {
        setError('Team not found');
        return;
      }

      const [teamId, data] = teamEntry;
      // Create a properly typed Team object
      const foundTeam: Team = {
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
      
      // Check if judge has already scored this team
      const scoresRef = ref(database, 'judgeScores');
      const scoresSnapshot = await get(scoresRef);
      if (scoresSnapshot.exists()) {
        const existingScores = scoresSnapshot.val();
        const judgeScore = Object.values(existingScores).find(
          (score: any) => score.teamNumber === teamNumber && score.judgeId === user?.uid
        );

        if (judgeScore) {
          setError('You have already scored this team');
          return;
        }
      }

      setTeam(foundTeam);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to fetch team information');
    }
  };

  const handleSubmit = async () => {
    if (!team || !user) return;

    try {
      setError('');
      setSuccess('');

      // Create the judge score
      const newScore: JudgeScore = {
        teamNumber: team.teamNumber,
        judgeId: user.uid,
        judgeName: user.name,
        scores,
        comments,
        timestamp: new Date().toISOString(),
      };

      // Add the new score
      const scoresRef = ref(database, 'judgeScores');
      const newScoreRef = push(scoresRef);
      await set(newScoreRef, newScore);

      // Update only the team status
      if (team.id) {
        const teamRef = ref(database, `teams/${team.id}`);
        await set(teamRef, {
          ...team,
          status: 'completed'
        });
      }

      setSuccess('Score submitted successfully!');
      setTeam(null);
      setTeamNumber('');
      setScores({
        criteria1: 5,
        criteria2: 5,
        criteria3: 5,
        criteria4: 5,
        criteria5: 5,
      });
      setComments('');
    } catch (err) {
      console.error('Error submitting score:', err);
      setError('Failed to submit score. Please try again.');
    }
  };

  const handleScoreChange = (criteria: keyof typeof scores) => (
    _event: Event,
    value: number | number[]
  ) => {
    setScores(prev => ({
      ...prev,
      [criteria]: value as number,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Score Teams
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Team Number"
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleTeamSearch}
            disabled={!teamNumber}
            fullWidth
          >
            Search Team
          </Button>
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

        {team && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Information
            </Typography>
            <Typography>Team Name: {team.teamName}</Typography>
            <Typography>Category: {team.category.toUpperCase()}</Typography>
            <Typography>School: {team.schoolName}</Typography>
            <Typography>Student 1: {team.student1}</Typography>
            <Typography>Student 2: {team.student2}</Typography>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Scoring Criteria
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(scores).map(([criteria, value]) => (
                <Grid item xs={12} key={criteria}>
                  <Typography gutterBottom>
                    {criteria.charAt(0).toUpperCase() + criteria.slice(1)}
                  </Typography>
                  <Slider
                    value={value}
                    onChange={handleScoreChange(criteria as keyof typeof scores)}
                    min={1}
                    max={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              sx={{ mt: 3, mb: 3 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              fullWidth
            >
              Submit Score
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Scoring; 