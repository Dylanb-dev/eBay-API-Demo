import React from 'react';
import TextField from 'material-ui/lib/text-field';
import AppBar from 'material-ui/lib/app-bar';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Paper from 'material-ui/lib/paper';
import { ScatterChart } from 'react-d3';
import FlatButton from 'material-ui/lib/flat-button';
import SelectField from 'material-ui/lib/select-field';
import GridList from 'material-ui/lib/grid-list/grid-list';
import GridTile from 'material-ui/lib/grid-list/grid-tile';

import $ from 'jquery';

export default class Search extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: '',
      data: [],
      windowWidth: window.innerWidth,
      searchWidth: 0,
      showTitle: true,
      showFields: false,
      region: 'AU',
      cond: 'USED',
      currency: '',
      listings: [],
      interval: 1,
    };
  }

  componentDidMount() {
    this.searchBarResize();
    window.addEventListener('resize', this.handleResize);
    $.get('/api/test')
      .then(data => {
        const returnData = data;
        for (let i = 0; i < data[0].values.length; i++) {
          returnData[0].values[i].x = new Date(returnData[0].values[i].x.slice(0, 19));
        }
        const oneDay = 24 * 60 * 60 * 1000;
        const interval = Math.ceil((Math.round(Math.abs(returnData[0].values[0].x.getTime() +
            - returnData[0].values[returnData[0].values.length - 1].x.getTime()) / (oneDay))) / 7);
        this.setState({ data: data,
          interval: interval,
          currency: data[0].currency,
          listings: data[0].listings,
        });
      });
  }
  handleResize = () => {
    this.searchBarResize();
  };

  searchBarResize = () => {
    let sT = true;
    let sW = 550;
    if (window.innerWidth < 740) {
      sT = false;
      if (window.innerWidth > 350) {
        sW = window.innerWidth - 150;
      } else {
        sW = 150;
      }
    }
    this.setState({
      windowWidth: Math.min(window.innerWidth, 950),
      searchWidth: sW,
      showTitle: sT,
    });
  };

  handleChange = (event) => {
    this.setState({
      value: event.target.value,
    });
  };

  handleChangeRegion = (event, index, value) => {
    this.setState({
      region: value,
    });
  };

  handleChangeCond = (event, index, value) => {
    this.setState({
      cond: value,
    });
  };

  handleSubmit = (event) => {
    const request = {
      keywords: event.target.value.toString(),
      condition: this.state.cond,
      locatedIn: this.state.region,
      time: 'SOLD',
    };

    $.post('/api', request).then(data => {
      const returnData = data;
      for (let i = 0; i < data[0].values.length; i++) {
        returnData[0].values[i].x = new Date(returnData[0].values[i].x.slice(0, 19));
      }
      const oneDay = 24 * 60 * 60 * 1000;
      const interval = Math.ceil((Math.round(Math.abs(returnData[0].values[0].x.getTime() +
          - returnData[0].values[returnData[0].values.length - 1].x.getTime()) / (oneDay))) / 7);
      this.setState({ data: data,
        interval: interval,
        currency: data[0].currency,
        listings: data[0].listings,
      });
    });
  };

  displayFields = () => {
    this.setState({
      showFields: !this.state.showFields,
    });
  };

  render() {
    const styles = {
      root: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
      },
      gridList: {
        width: this.state.windowWidth - 30,
        height: 400,
        overflowY: 'auto',
        marginBottom: 24,
      },
    };
    const GridListExampleSimple = () => (
    <div style={styles.root}>
      <GridList
        cellHeight={200}
        style={styles.gridList}
      >
        {this.state.listings.map(tile => (
          <GridTile
            key={tile.imageURL}
            title={
              <a style={{ color: 'White', textDecoration: 'none' }}
                href={tile.URL}
              >
              {tile.name}
              </a>
          }
            subtitle={`${tile.price} ${this.state.currency}`}
          >
            <img src={tile.imageURL}/>
          </GridTile>
        ))}
      </GridList>
    </div>
    );

    let Title;
    if (this.state.showTitle) {
      Title = 'eBay API explorer';
    } else {
      Title = null;
    }

    let SelectFields;
    if (this.state.showFields) {
      SelectFields =
      (<div>

  <SelectField style={{ float: 'right', margin: 10, marginBottom: -34, width: 128 }}
    value={this.state.region} onChange={this.handleChangeRegion}
  >
  <MenuItem value={'AU'} primaryText="AU"/>
  <MenuItem value={'US'} primaryText="US"/>
  <MenuItem value={'GB'} primaryText="GB"/>
  </SelectField>

  <SelectField style={{ float: 'right', margin: 10, marginBottom: -34, width: 128 }}
    value={this.state.cond} onChange={this.handleChangeCond}
  >
  <MenuItem value={'USED'} primaryText="USED"/>
  <MenuItem value={'NEW'} primaryText="NEW"/>
  </SelectField>
    </div>);
    } else {
      SelectFields = <h1/>;
    }

    const appstyle = {
      height: 64,
      backgroundColor: '#3182bd',
    };

    const style = {
      border: 10,
      height: 46,
      paddingLeft: 10,
      display: 'inline-block',
      marginRight: 10,
      marginLeft: -10,
      width: this.state.searchWidth,
    };

    let axis = { x: 'Date sold', y: `Price ${this.state.currency}` };
    const margins = { left: 80, right: 50, top: 50, bottom: 70 };
    let interval = this.state.interval;
    let height = Math.round(this.state.windowWidth / 1.618);
    if (this.state.windowWidth < 450) {
      interval = interval * 2;
      height = this.state.windowWidth;
      axis = { x: '', y: '' };
    }

    return (
      <div>
        <AppBar style={appstyle} title={Title}
          showMenuIconButton={false}
          iconElementRight={
          <div>
          <Paper style={style} zDepth={1}>
          <TextField
            value={this.state.value}
            hintText="e.g. macbook pro 2015"
            onChange={this.handleChange}
            onEnterKeyDown={this.handleSubmit}
            underlineShow={false}
          />
          </Paper>
          <FlatButton onClick={this.displayFields} style={{ color: 'White' }}
            label="Settings"
          />
          </div>
        }
        />
        {SelectFields}
        <ScatterChart
          data={this.state.data}
          height={height}
          width={this.state.windowWidth}
          margins = {margins}
          circle-fill={'#5C6BC0'}
          gridHorizontal
          xAxisTickInterval={{ unit: 'day', interval: interval }}
          yAxisTickInterval={{ unit: 'number', interval: 1 }}
          xAxisLabel={axis.x}
          yAxisLabel={axis.y}
          xAxisOffset={0}
          yAxisLabelOffset={60}
          xAxisLabelOffset={50}
        />
          <h1 style={{ color: '#3182bd' }}>Listings</h1>
          <GridListExampleSimple/>
      </div>
    );
  }
}
