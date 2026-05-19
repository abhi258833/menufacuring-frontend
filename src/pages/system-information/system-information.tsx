import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Avatar,
  Fade,
} from '@mui/material';
import { Storage, Code, DeveloperBoard } from '@mui/icons-material';

const SystemInformation: React.FC = () => {
  const [apiVersion, setApiVersion] = useState<string>('Loading...');
  const [dbVersion, setDbVersion] = useState<string>('Loading...');
  const [techStack, setTechStack] = useState<string[]>([]);

  useEffect(() => {
    // Simulated fetch logic
    setTimeout(() => {
      setApiVersion('v8.1');
      setDbVersion('PostgreSQL 17');
      setTechStack([
        'React 18',
        'Material UI v5',
        'TypeScript',
        'Redux Toolkit',
        'React Router',
        'Axios',
      ]);
    }, 500); 
  }, []);

  const renderCardHeader = (icon: React.ReactElement, title: string) => (
    <Box display="flex" alignItems="center" mb={2}>
      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{icon}</Avatar>
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>
    </Box>
  );

  return (
    <Fade in timeout={600}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
          System & UI Information
        </Typography>

        <Grid container spacing={4}>
          {/* API Version */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={6}
              sx={{
                background: 'linear-gradient(to right, #e0f7fa, #ffffff)',
                borderRadius: 3,
              }}
            >
              <CardContent>
                {renderCardHeader(<Code />, 'DSpace REST API')}
                <Divider />
                <Box mt={2}>
                  <Typography variant="body1" color="text.secondary">
                    {apiVersion}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Database Version */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={6}
              sx={{
                background: 'linear-gradient(to right, #f3e5f5, #ffffff)',
                borderRadius: 3,
              }}
            >
              <CardContent>
                {renderCardHeader(<Storage />, 'Database')}
                <Divider />
                <Box mt={2}>
                  <Typography variant="body1" color="text.secondary">
                    {dbVersion}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* UI Tech Stack */}
          <Grid item xs={12}>
            <Card
              elevation={6}
              sx={{
                background: 'linear-gradient(to right, #e8f5e9, #ffffff)',
                borderRadius: 3,
              }}
            >
              <CardContent>
                {renderCardHeader(<DeveloperBoard />, 'UI Tech Stack')}
                <Divider />
                <List>
                  {techStack.map((item, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{ fontSize: 15 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Fade>
  );
};

export default SystemInformation;
