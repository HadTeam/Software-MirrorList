import { FC, useCallback, useEffect, useRef, useReducer, useState } from 'react';
import { Icon, Label, Pagination, Popup, Search, Table } from 'semantic-ui-react';
import * as _ from 'lodash';
import { File, SearchState } from './types';
import files from './data/processed/files.json';

interface HashPopupProps {
  hashObj: {
    [key: string]: string;
  };
}

const HashPopup: FC<HashPopupProps> = ({ hashObj }) => {
  return (
    <Popup
      on='click'
      pinned
      trigger={<Label as='a'>hash: (click)</Label>}
      positionFixed
      hideOnScroll
      position='bottom right'
    >
      {Object.keys(hashObj).map((hashType, index) => (
        <Popup.Content key={index}>
          {hashType}: {hashObj[hashType]}
        </Popup.Content>
      ))}
    </Popup>
  );
};

const Files: FC = () => {
  const [activePage, setActivePage] = useState(1);
  const pageLength = 10;

  const shownFiles = (files as File[]).filter((item) => {
    return item.urlType === 'directly';
  });

  const filesTot = shownFiles.length;
  const pagesTot = Math.floor(filesTot / pageLength) + (filesTot % pageLength !== 0);
  const leftNum = (activePage - 1) * pageLength;

  shownFiles.forEach((item, index) => {
    item.index = index;
  });

  const searchInitState: SearchState = {
    loading: false,
    searchResults: [],
    value: ''
  };

  const searchReducer = (state: SearchState, action: any) => {
    switch (action.type) {
      case 'SEARCH_START':
        return { ...state, loading: true, value: action.query };
      case 'SEARCH_FINISH':
        return { ...state, loading: false, searchResults: action.results };
      case 'SEARCH_UPDATE_SELECTION': {
        setActivePage(action.selection.page);
        return { ...state, value: action.selection.title };
      }
      case 'SEARCH_CLEAN':
      default:
        return searchInitState;
    }
  };

  const [searchState, searchDispatch] = useReducer(searchReducer, searchInitState);
  const { loading, searchResults, value } = searchState;

  const timeoutRef = useRef<NodeJS.Timeout>();

  const search = useCallback((e: any, data: { value: string }) => {
    clearTimeout(timeoutRef.current);
    searchDispatch({ type: 'SEARCH_START', query: data.value });

    timeoutRef.current = setTimeout(() => {
      if (data.value.length === 0) {
        searchDispatch({ type: 'SEARCH_CLEAN' });
        return;
      }

      const isMatch = (item: File) => {
        const re = new RegExp(_.escapeRegExp(data.value), 'i');
        return re.test(item.filename);
      };

      searchDispatch({
        type: 'SEARCH_FINISH',
        results: shownFiles.filter(isMatch).map((item) => ({
          title: item.filename,
          description: item.tags.source,
          id: item.filename + item.tags.source,
          page: Math.floor((item.index || 0) / pageLength) + 1
        }))
      });
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div id='body'>
      <Table attached='bottom' singleLine stackable selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Filename</Table.HeaderCell>
            <Table.HeaderCell>
              <Search
                fluid
                placeholder='Search...'
                loading={loading}
                onSearchChange={search}
                results={searchResults}
                value={value}
                onResultSelect={(e, data) => {
                  searchDispatch({ type: 'SEARCH_UPDATE_SELECTION', selection: data.result });
                }}
              />
            </Table.HeaderCell>
            <Table.HeaderCell>Tags</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {shownFiles.slice(leftNum, leftNum + pageLength).map((item, index) => (
            <Table.Row key={index}>
              <Table.Cell singleLine width={5}>
                <Icon name='text file' />
                <a
                  href={item.url}
                  target='_blank'
                  rel="noreferrer"
                  name={item.url + item.tags.source}
                >
                  {item.filename}
                </a>
              </Table.Cell>
              <Table.Cell colSpan={2} textAlign='right'>
                <Label.Group>
                  {Object.keys(item.tags).map((tag) => {
                    switch (tag) {
                      case 'hash':
                        return <HashPopup hashObj={item.tags[tag]} key={index + tag} />;
                      case 'id':
                        return null;
                      default:
                        return <Label key={index + tag}>{tag}: {item.tags[tag]}</Label>;
                    }
                  })}
                </Label.Group>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell colSpan={3} textAlign='center'>
              <Pagination
                totalPages={pagesTot}
                activePage={activePage}
                onPageChange={(e, data) => {
                  setActivePage(data.activePage as number);
                }}
              />
            </Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </div>
  );
};

export default Files;