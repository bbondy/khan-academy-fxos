/* @flow */

"use strict";

import React from "react";
import l10n from "../l10n";
import component from "omniscient";
import { getTitle } from "../data/topic-tree-helper";
import {ContentListViewer} from "./topic";

/**
 * Represents the topic search input item which is right below the header.
 */
export const TopicSearch = component(({topicTreeNode, searchValue}, {onTopicSearch, editSearch}) => {
    const onChange = (event) => {
        var topicSearch = event.target.value;
        editSearch(() => topicSearch);
        onTopicSearch(topicSearch);
    };

    const onFocus = () => {
        // TODO
        /*
        setTimeout(() => {
            $("html, body").stop(true, true).animate({
                scrollTop: $(this.refs.search.getDOMNode()).offset().top
            }, 500);
        }, 500);
        */
    };

    const onBlur = () => {
        // TODO
        /*
        $("html, body").stop(true, true).animate({
            scrollTop: 0
        }, 700);
        */
    };

    var text = l10n.get("search");
    if (getTitle(topicTreeNode)) {
        text = l10n.get("search-topic", {
            topic: getTitle(topicTreeNode)
        });
    }

    return <div>
        <input ref="search"
               className="search app-chrome"
               type="searh"
               placeholder={text}
               value={searchValue}
               required=""
               onChange={onChange.bind(this)}
               onFocus={onFocus.bind(this)}
               onBlur={onBlur.bind(this)}
               />
    </div>;
}).jsx;

/**
 * Represents a search result list which is basically just a wrapper around a
 * ContentListViewer for now.
 */
export const SearchResultsViewer = component(({options, collection, startedEntityIds, completedEntityIds}, {onClickContentItem}) =>
    <div className="topic-list-container">
        <ContentListViewer topicTreeNodes={collection}
                           options={options}
                           startedEntityIds={startedEntityIds}
                           completedEntityIds={completedEntityIds}
                           statics={{
                               onClickContentItem,
                           }}/>
    </div>
).jsx;
